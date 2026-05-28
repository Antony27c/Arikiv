import json
import math
import os
import logging
import re
from datetime import datetime

import requests

logger = logging.getLogger(__name__)

RN51_BBOX = {
    "lat_min": -24.5,
    "lat_max": -23.0,
    "lon_min": -66.5,
    "lon_max": -65.5,
}

PunaLocations = [
    "quebrada del toro", "chorrillos", "tastil", "san antonio de los cobres",
    "santa rosa de los pastos grandes", "olacapato", "la polvorilla",
    "abra del acay", "campo quijano", "rosario de lerma", "la meridiana",
    "vega del chuschín", "alumbre", "muñano", "caipe", "tipán",
    "ruta 51", "rn 51", "ruta nacional 51",
]

FraudLocations = [
    "salta capital", "cafayate", "vaqueros", "la caldera", "cemetario",
    "campo santo", "general güemes", "metán", "rosario de la frontera",
]

UrgencyKeywords = {
    "critica": ["derrumbe", "alud", "corte total", "accidente grave", "deslizamiento", "roca", "detenido total"],
    "alta": ["obstrucción", "parcial", "vehículo averiado", "carril", "desprendimiento", "camión varado"],
    "moderada": ["neblina", "llovizna", "bache", "lluvia", "niebla", "calzada mojada", "reducción"],
    "baja": ["banquina", "visibilidad", "menor", "señalización", "cartel", "animal suelto"],
}

AI_ENDPOINT = os.getenv("AI_MODEL_ENDPOINT", "")
AI_API_KEY = os.getenv("AI_MODEL_API_KEY", "")

SYSTEM_PROMPT = (
    "Sos un agente de auditoría vial para la Ruta Nacional 51 (RN 51) en Salta, Argentina. "
    "Analizás reportes de incidentes de choferes de camiones mineros. "
    "Respondé SOLO con un objeto JSON, sin markdown ni texto adicional. "
    "Campos requeridos:\n"
    "- status_verificacion: 'APROBADO' si las coordenadas coinciden con la descripción y están dentro de la RN 51, 'RECHAZADO' si hay fraude o incoherencia\n"
    "- score_confianza_geografica: número entre 0.0 y 1.0\n"
    "- resumen_tecnico_ia: resumen formal del incidente en español\n"
    "- clasificacion_urgencia_ia: 'CRÍTICA' | 'ALTA' | 'MODERADA' | 'BAJA'\n"
    "- analisis_coherencia: UNA SOLA ORACIÓN breve que relacione el tipo de incidente con la ubicación, ej: 'El derrumbe reportado en km 45 está dentro del corredor de RN 51' o 'El reporte de neblina indica Salta Capital pero describe la Quebrada del Toro'\n\n"
    "Reglas:\n"
    "1. Si la descripción menciona locaciones de la Puna (Quebrada del Toro, Chorrillos, San Antonio de los Cobres, Tastil) "
    "pero las coordenadas corresponden a Salta Capital o Cafayate → RECHAZADO (fraude)\n"
    "2. Si las coordenadas están fuera de RN 51 (lat -24.5 a -23.0, lon -66.5 a -65.5) → RECHAZADO\n"
    "3. Si el texto menciona 'Salta Capital' o 'Cafayate' pero las coordenadas están dentro de RN 51 → RECHAZADO\n"
    "4. Clasificá urgencia según impacto en logística del litio\n"
    "5. SIEMPRE respondé en español"
)

def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def _classify_urgency(desc):
    desc_lower = desc.lower()
    for nivel, keywords in UrgencyKeywords.items():
        for kw in keywords:
            if kw in desc_lower:
                return nivel.upper()
    return "BAJA"

def _geographic_analysis(lat, lon, desc, tipo, kil):
    desc_lower = desc.lower()
    mentions_puna = any(loc in desc_lower for loc in PunaLocations)
    mentions_fraud = any(loc in desc_lower for loc in FraudLocations)
    in_rn51 = (
        RN51_BBOX["lat_min"] <= lat <= RN51_BBOX["lat_max"]
        and RN51_BBOX["lon_min"] <= lon <= RN51_BBOX["lon_max"]
    )
    in_salta_capital = (-24.8 <= lat <= -24.7) and (-65.5 <= lon <= -65.3)
    in_cafayate = (-26.1 <= lat <= -26.0) and (-66.0 <= lon <= -65.9)

    ubicacion = f"km {kil}" if kil else f"({lat}, {lon})"

    if mentions_puna and in_salta_capital:
        loc = next((l for l in PunaLocations if l in desc_lower), "la Puna")
        return "RECHAZADO", f"El {tipo.lower()} menciona '{loc}' pero está reportado en Salta Capital"
    if mentions_puna and in_cafayate:
        loc = next((l for l in PunaLocations if l in desc_lower), "la Puna")
        return "RECHAZADO", f"El {tipo.lower()} describe '{loc}' pero las coordenadas caen en Cafayate"
    if mentions_fraud and in_rn51:
        loc = next((l for l in FraudLocations if l in desc_lower), "fuera de la ruta")
        return "RECHAZADO", f"El {tipo.lower()} menciona '{loc}' pero está geolocalizado en RN 51"
    if not in_rn51 and not (lat == 0.0 and lon == 0.0):
        return "RECHAZADO", f"El {tipo.lower()} en {ubicacion} está fuera del corredor de RN 51"
    if lat == 0.0 and lon == 0.0:
        return "RECHAZADO", f"El {tipo.lower()} no tiene coordenadas válidas (GPS sin señal)"

    return "APROBADO", f"El {tipo.lower()} en {ubicacion} está dentro del corredor de RN 51 y es coherente"

def _generate_summary(desc, tipo, kil):
    desc_clean = re.sub(r'\s+', ' ', desc.strip())
    summary = "Reporte en RN 51"
    if kil:
        summary += f", km {kil}"
    summary += f". Tipo: {tipo}. "
    if len(desc_clean) > 100:
        summary += desc_clean[:100] + "..."
    else:
        summary += desc_clean
    return summary

def _call_ai(lat, lon, desc, tipo, kil, driver_id):
    if not AI_ENDPOINT or not AI_API_KEY:
        logger.info("AI: no configurado, usando reglas")
        return None

    user_prompt = (
        f"Reporte de incidente vial:\n"
        f"- Conductor: {driver_id}\n"
        f"- Coordenadas: ({lat}, {lon})\n"
        f"- Kilómetro: {kil or 'no especificado'}\n"
        f"- Tipo reportado: {tipo}\n"
        f"- Descripción: {desc}\n\n"
        f"Analizá y respondé SOLO con el objeto JSON."
    )

    try:
        headers = {
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type": "application/json",
        }
        body = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
        }

        resp = requests.post(AI_ENDPOINT, json=body, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        content = data["choices"][0]["message"]["content"]
        result = json.loads(content)

        logger.info("AI: respuesta OK — status=%s", result.get("status_verificacion"))
        return result

    except Exception as e:
        logger.warning("AI: error en llamada (%s), usando reglas", str(e))
        return None

RECENT_REPORTS = []

def audit_report(report):
    lat = report.get("latitude") or report.get("geolocalizacion_reportada", {}).get("coordenadas", {}).get("latitud", 0)
    lon = report.get("longitude") or report.get("geolocalizacion_reportada", {}).get("coordenadas", {}).get("longitud", 0)
    driver_id = report.get("driver_id") or report.get("metadata_origen", {}).get("chofer_id", "")
    desc = report.get("description") or report.get("datos_evento", {}).get("descripcion_chofer", "")
    tipo = report.get("tipo_incidente") or report.get("datos_evento", {}).get("tipo_incidente", "No especificado")
    kil = report.get("kilometro") or report.get("geolocalizacion_reportada", {}).get("kilometro")

    lat = float(lat) if lat else 0.0
    lon = float(lon) if lon else 0.0

    flags = []
    if lat == 0.0 and lon == 0.0:
        flags.append("Coordenadas (0,0) — posible GPS sin señal")

    for prev in RECENT_REPORTS:
        if prev["driver_id"] != driver_id:
            continue
        dist = _haversine_km(lat, lon, prev["lat"], prev["lon"])
        if dist < 0.05:
            flags.append("Reporte duplicado a <50m del anterior del mismo chofer")

    RECENT_REPORTS.append({
        "driver_id": driver_id,
        "lat": lat,
        "lon": lon,
        "ts": datetime.now().isoformat(),
    })
    if len(RECENT_REPORTS) > 100:
        RECENT_REPORTS.pop(0)

    ai_result = _call_ai(lat, lon, desc, tipo, kil, driver_id)

    if ai_result:
        status_verificacion = ai_result.get("status_verificacion", "RECHAZADO")
        analisis = ai_result.get("analisis_coherencia", "Sin análisis")
        clasificacion_urgencia = ai_result.get("clasificacion_urgencia_ia", "BAJA")
        resumen = ai_result.get("resumen_tecnico_ia", _generate_summary(desc, tipo, kil))
        score = max(0.0, min(1.0, ai_result.get("score_confianza_geografica", 0.5)))
    else:
        status_verificacion, analisis = _geographic_analysis(lat, lon, desc, tipo, kil)
        clasificacion_urgencia = _classify_urgency(desc)
        resumen = _generate_summary(desc, tipo, kil)

        base_score = 100
        if status_verificacion == "RECHAZADO":
            base_score -= 40
        base_score -= len(flags) * 15
        if clasificacion_urgencia == "CRÍTICA":
            base_score -= 10
        score = max(0, min(100, base_score)) / 100.0

    return {
        "agente_id": "arkiv-miner-audit-v1",
        "status_verificacion": status_verificacion,
        "score_confianza_geografica": score,
        "resumen_tecnico_ia": resumen,
        "clasificacion_urgencia_ia": clasificacion_urgencia,
        "analisis_coherencia": analisis,
        "passed": status_verificacion == "APROBADO",
        "flags": flags,
    }

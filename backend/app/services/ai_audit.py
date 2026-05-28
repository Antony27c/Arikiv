import re
import math
from datetime import datetime

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

def _geographic_analysis(lat, lon, desc):
    desc_lower = desc.lower()
    mentions_puna = any(loc in desc_lower for loc in PunaLocations)
    mentions_fraud = any(loc in desc_lower for loc in FraudLocations)
    in_rn51 = (
        RN51_BBOX["lat_min"] <= lat <= RN51_BBOX["lat_max"]
        and RN51_BBOX["lon_min"] <= lon <= RN51_BBOX["lon_max"]
    )
    in_salta_capital = (-24.8 <= lat <= -24.7) and (-65.5 <= lon <= -65.3)
    in_cafayate = (-26.1 <= lat <= -26.0) and (-66.0 <= lon <= -65.9)

    if mentions_puna and in_salta_capital:
        return "RECHAZADO", "El texto describe locaciones de la Puna pero las coordenadas corresponden a Salta Capital"
    if mentions_puna and in_cafayate:
        return "RECHAZADO", "El texto describe locaciones de la Puna pero las coordenadas corresponden a Cafayate"
    if mentions_fraud and in_rn51:
        return "RECHAZADO", "El texto menciona ubicaciones fuera de la RN 51 pero las coordenadas están dentro del corredor"
    if not in_rn51 and not (lat == 0.0 and lon == 0.0):
        return "RECHAZADO", "Coordenadas fuera del corredor de la Ruta Nacional 51"
    if lat == 0.0 and lon == 0.0:
        return "RECHAZADO", "Coordenadas (0,0) — GPS sin señal"

    return "APROBADO", "Coordenadas coherentes con la Ruta Nacional 51"

def _clean_description(desc):
    desc = re.sub(r'\s+', ' ', desc.strip())
    return desc

def _generate_summary(desc, tipo, kil):
    desc_clean = _clean_description(desc)
    summary = f"Reporte en RN 51"
    if kil:
        summary += f", km {kil}"
    summary += f". Tipo: {tipo}. "
    if len(desc_clean) > 100:
        summary += desc_clean[:100] + "..."
    else:
        summary += desc_clean
    return summary

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

    status_verificacion, analisis = _geographic_analysis(lat, lon, desc)
    clasificacion_urgencia = _classify_urgency(desc)
    resumen = _generate_summary(desc, tipo, kil)

    base_score = 100
    if status_verificacion == "RECHAZADO":
        base_score -= 40
    base_score -= len(flags) * 15
    if clasificacion_urgencia == "CRÍTICA":
        base_score -= 10
    score = max(0, min(100, base_score))

    return {
        "agente_id": "arkiv-miner-audit-v1",
        "status_verificacion": status_verificacion,
        "score_confianza_geografica": score / 100.0,
        "resumen_tecnico_ia": resumen,
        "clasificacion_urgencia_ia": clasificacion_urgencia,
        "analisis_coherencia": analisis,
        "passed": status_verificacion == "APROBADO",
        "flags": flags,
    }

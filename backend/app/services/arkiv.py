import json
import os
import time
import base64
import subprocess
import logging
from dotenv import load_dotenv

from app.services.db import save_report as db_save_report, list_reports as db_list_reports

load_dotenv()

logger = logging.getLogger(__name__)

ARKIV_PRIVATE_KEY = os.getenv("ARKIV_PRIVATE_KEY", "")
ARKIV_WRITER_CWD = os.getenv("ARKIV_WRITER_CWD", "/app/frontend")

EXPIRES_IN_MAP = {
    "Derrumbe": 31536000,
    "Accidente": 31536000,
    "Señalización": 31536000,
    "Bache": 31536000,
    "Neblina": 86400,
    "Lluvia": 86400,
}

DEFAULT_EXPIRES_IN = 604800


def get_expires_in(tipo_incidente: str) -> int:
    return EXPIRES_IN_MAP.get(tipo_incidente, DEFAULT_EXPIRES_IN)


def _build_payload(report, audit):
    meta = report.get("metadata_origen", {})
    geo = report.get("geolocalizacion_reportada", {})
    evento = report.get("datos_evento", {})
    tipo = evento.get("tipo_incidente", "Otro")
    expires_in = get_expires_in(tipo)

    return json.dumps({
        "reporte_id": report.get("reporte_id", ""),
        "expiresIn": expires_in,
        "metadata_origen": {
            "chofer_id": meta.get("chofer_id", ""),
            "empresa_minera": meta.get("empresa_minera", ""),
            "patente_camion": meta.get("patente_camion", ""),
            "timestamp_offline": meta.get("timestamp_offline", ""),
        },
        "geolocalizacion_reportada": {
            "ruta": geo.get("ruta", "Ruta Nacional 51"),
            "kilometro": geo.get("kilometro"),
            "coordenadas": {
                "latitud": geo.get("coordenadas", {}).get("latitud", 0),
                "longitud": geo.get("coordenadas", {}).get("longitud", 0),
            },
        },
        "datos_evento": {
            "tipo_incidente": evento.get("tipo_incidente", ""),
            "descripcion_chofer": evento.get("descripcion_chofer", ""),
            "imagen_hash_sha256": evento.get("imagen_hash_sha256", ""),
        },
        "validacion_ia": {
            "agente_id": audit.get("agente_id", ""),
            "status_verificacion": audit.get("status_verificacion", ""),
            "score_confianza_geografica": audit.get("score_confianza_geografica", 0.0),
            "resumen_tecnico_ia": audit.get("resumen_tecnico_ia", ""),
            "clasificacion_urgencia_ia": audit.get("clasificacion_urgencia_ia", ""),
            "analisis_coherencia": audit.get("analisis_coherencia", ""),
            "distancia_ruta_km": audit.get("distancia_ruta_km"),
            "direccion": audit.get("direccion"),
        },
    }, ensure_ascii=False)


def _build_attributes(report, audit):
    evento = report.get("datos_evento", {})
    attr_list = [
        {"key": "_project", "value": "rutasegura_rn51"},
        {"key": "tipo_incidente", "value": evento.get("tipo_incidente", "Otro")},
    ]
    return attr_list


def _call_arkiv_writer(private_key, payload_str, expires_in, attributes):
    payload_b64 = base64.b64encode(payload_str.encode("utf-8")).decode("ascii")
    attrs_b64 = base64.b64encode(json.dumps(attributes).encode("utf-8")).decode("ascii")

    result = subprocess.run(
        ["node", "arkiv-writer.mjs", private_key, payload_b64, str(expires_in), attrs_b64],
        capture_output=True,
        text=True,
        timeout=60,
        cwd=ARKIV_WRITER_CWD,
    )

    if result.returncode != 0:
        logger.error("ARKIV writer stderr: %s", result.stderr.strip())
        raise Exception(result.stderr.strip() or f"arkiv-writer exited with code {result.returncode}")

    try:
        output = json.loads(result.stdout.strip())
    except json.JSONDecodeError:
        raise Exception(f"arkiv-writer output no es JSON: {result.stdout[:200]}")

    if not output.get("success"):
        raise Exception(output.get("error", "unknown error from arkiv-writer"))

    return output.get("entityKey", ""), output.get("txHash", "")


def store_report(report, audit, reporte_id=None):
    if not reporte_id:
        reporte_id = report.get("reporte_id") or f"RP-{int(time.time())}"

    payload_str = _build_payload(report, audit)
    evento = report.get("datos_evento", {})
    expires_in = get_expires_in(evento.get("tipo_incidente", "Otro"))
    attributes = _build_attributes(report, audit)

    if not ARKIV_PRIVATE_KEY:
        meta = report.get("metadata_origen", {})
        entity_key = f"0xSIM_{meta.get('chofer_id', 'unknown')}_{int(time.time())}"
        logger.info("ARKIV: modo simulación — entity_key=%s", entity_key)
        result = {
            "reporte_id": reporte_id,
            "entity_key": entity_key,
            "tx_hash": "0xSIM",
            "stored": False,
            "simulated": True,
        }
    else:
        try:
            entity_key, tx_hash = _call_arkiv_writer(
                ARKIV_PRIVATE_KEY, payload_str, expires_in, attributes
            )
            logger.info("ARKIV: almacenado — entity_key=%s tx=%s", entity_key, tx_hash)
            result = {
                "reporte_id": reporte_id,
                "entity_key": entity_key,
                "tx_hash": tx_hash,
                "stored": True,
                "simulated": False,
            }
        except Exception as e:
            logger.error("ARKIV: error al almacenar — %s", str(e))
            meta = report.get("metadata_origen", {})
            entity_key = f"0xSIM_{meta.get('chofer_id', 'unknown')}_{int(time.time())}"
            logger.info("ARKIV: fallback a simulación — entity_key=%s", entity_key)
            result = {
                "reporte_id": reporte_id,
                "entity_key": entity_key,
                "tx_hash": "0xSIM",
                "stored": False,
                "simulated": True,
                "error": str(e),
            }

    audit["arkiv_tx_hash"] = result["tx_hash"]
    audit["arkiv_entity_key"] = result["entity_key"]
    audit["arkiv_stored"] = result["stored"]
    audit["arkiv_simulated"] = result["simulated"]
    db_save_report(reporte_id, report, audit)
    result["reporte_id"] = reporte_id
    return result


def query_reports(tipo=None, limit=50, verification=None):
    return db_list_reports(limit=limit, tipo=tipo, verification=verification)
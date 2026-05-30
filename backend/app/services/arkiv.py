import json
import os
import time
import logging
from dotenv import load_dotenv
import httpx

from app.services.db import save_report as db_save_report, list_reports as db_list_reports

load_dotenv()

logger = logging.getLogger(__name__)

ARKIV_RPC = os.getenv("ARKIV_RPC_URL", "https://braga.hoodi.arkiv.network/rpc")
ARKIV_PRIVATE_KEY = os.getenv("ARKIV_PRIVATE_KEY", "")

ARKIV_ADDRESS = "0x0000000000000000000000000000000061726976"
CHAIN_ID = 60138453102

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


def _rpc_call(method, params):
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params,
    }
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(ARKIV_RPC, json=payload)
        resp.raise_for_status()
        data = resp.json()
        if "error" in data:
            raise Exception(f"RPC error: {data['error']}")
        return data["result"]


def store_report(report, audit, reporte_id=None):
    if not reporte_id:
        reporte_id = report.get("reporte_id") or f"RP-{int(time.time())}"

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

    audit["arkiv_tx_hash"] = result["tx_hash"]
    audit["arkiv_entity_key"] = result["entity_key"]
    audit["arkiv_stored"] = result["stored"]
    audit["arkiv_simulated"] = result["simulated"]
    db_save_report(reporte_id, report, audit)
    return result


def query_reports(tipo=None, limit=50, verification=None):
    return db_list_reports(limit=limit, tipo=tipo, verification=verification)

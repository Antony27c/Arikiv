import json
import os
import time
import logging
from dotenv import load_dotenv

from app.services.db import save_report as db_save_report, list_reports as db_list_reports

load_dotenv()

logger = logging.getLogger(__name__)

ARKIV_RPC = os.getenv("ARKIV_RPC_URL", "https://braga.hoodi.arkiv.network/rpc")
ARKIV_PRIVATE_KEY = os.getenv("ARKIV_PRIVATE_KEY", "")

ARKIV_ADDRESS = "0x000000000000000000000000000000000061726976"
CHAIN_ID = 60138453102

def _build_payload(report, audit):
    meta = report.get("metadata_origen", {})
    geo = report.get("geolocalizacion_reportada", {})
    evento = report.get("datos_evento", {})

    return json.dumps({
        "reporte_id": report.get("reporte_id", ""),
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

def store_report(report, audit, reporte_id=None):
    if not reporte_id:
        reporte_id = report.get("reporte_id") or f"RP-{int(time.time())}"
    result = {"reporte_id": reporte_id}

    try:
        payload_str = _build_payload(report, audit)

        if not ARKIV_PRIVATE_KEY:
            meta = report.get("metadata_origen", {})
            entity_key = f"0xSIM_{meta.get('chofer_id', 'unknown')}_{int(time.time())}"
            logger.info("ARKIV: modo simulación — entity_key=%s", entity_key)
            result.update({
                "entity_key": entity_key,
                "tx_hash": "0xSIM",
                "stored": False,
                "simulated": True,
            })
        else:
            from web3 import Web3
            from eth_account import Account

            w3 = Web3(Web3.HTTPProvider(ARKIV_RPC))
            account = Account.from_key(ARKIV_PRIVATE_KEY)

            tx = {
                "to": ARKIV_ADDRESS,
                "from": account.address,
                "value": 0,
                "data": w3.to_bytes(text=payload_str).hex(),
                "chainId": CHAIN_ID,
            }

            gas = w3.eth.estimate_gas(tx)
            tx["gas"] = gas
            tx["gasPrice"] = w3.eth.gas_price
            nonce = w3.eth.get_transaction_count(account.address)
            tx["nonce"] = nonce

            signed = account.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

            entity_key = f"0x{receipt['logs'][0]['data'].hex()}" if receipt.get("logs") else tx_hash.hex()
            logger.info("ARKIV: almacenado — entity_key=%s tx=%s", entity_key, tx_hash.hex())

            result.update({
                "entity_key": entity_key,
                "tx_hash": tx_hash.hex(),
                "stored": True,
                "simulated": False,
            })

    except Exception as e:
        logger.error("ARKIV: error al almacenar — %s", str(e))
        result.update({
            "entity_key": "0xERR",
            "tx_hash": "0xERR",
            "stored": False,
            "simulated": False,
            "error": str(e),
        })

    db_save_report(reporte_id, report, audit)
    result["reporte_id"] = reporte_id
    return result

def query_reports(tipo=None, limit=50, verification=None):
    return db_list_reports(limit=limit, tipo=tipo, verification=verification)

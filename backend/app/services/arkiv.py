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


def _sign_and_send_tx(tx_dict):
    from eth_account import Account
    acct = Account.from_key(ARKIV_PRIVATE_KEY)
    signed = acct.sign_transaction(tx_dict)
    raw_hex = signed.raw_transaction.hex()
    if not raw_hex.startswith("0x"):
        raw_hex = "0x" + raw_hex
    tx_hash = _rpc_call("eth_sendRawTransaction", [raw_hex])
    return tx_hash


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
            from eth_account import Account

            acct = Account.from_key(ARKIV_PRIVATE_KEY)
            nonce = int(_rpc_call("eth_getTransactionCount", [acct.address, "latest"]), 16)
            gas_price = int(_rpc_call("eth_gasPrice", []), 16)

            tx = {
                "to": ARKIV_ADDRESS,
                "from": acct.address,
                "value": 0,
                "data": "0x" + payload_str.encode().hex(),
                "chainId": CHAIN_ID,
                "nonce": nonce,
                "gasPrice": gas_price,
                "gas": 2100000,
            }

            tx_hash_raw = _sign_and_send_tx(tx)
            logger.info("ARKIV: enviado — tx=%s", tx_hash_raw)

            receipt = _rpc_call("eth_getTransactionReceipt", [tx_hash_raw])
            retries = 0
            while receipt is None and retries < 10:
                time.sleep(2)
                receipt = _rpc_call("eth_getTransactionReceipt", [tx_hash_raw])
                retries += 1

            tx_hash_hex = tx_hash_raw if tx_hash_raw.startswith("0x") else "0x" + tx_hash_raw
            entity_key = f"0x{receipt['logs'][0]['data'][2:]}" if receipt and receipt.get("logs") and receipt["logs"][0].get("data") else tx_hash_hex

            logger.info("ARKIV: almacenado — entity_key=%s tx=%s", entity_key, tx_hash_hex)

            result.update({
                "entity_key": entity_key,
                "tx_hash": tx_hash_hex,
                "stored": True,
                "simulated": False,
            })

    except Exception as e:
        logger.error("ARKIV: error al almacenar — %s", str(e))
        err_msg = str(e)
        if "non-golembase" in err_msg:
            logger.info("ARKIV: red requiere GolemBase, usando simulación")
            meta = report.get("metadata_origen", {})
            entity_key = f"0xSIM_{meta.get('chofer_id', 'unknown')}_{int(time.time())}"
            result.update({
                "entity_key": entity_key,
                "tx_hash": "0xSIM",
                "stored": False,
                "simulated": True,
            })
        else:
            result.update({
                "entity_key": "0xERR",
                "tx_hash": "0xERR",
                "stored": False,
                "simulated": False,
                "error": str(e),
            })

    audit["arkiv_tx_hash"] = result.get("tx_hash", "")
    db_save_report(reporte_id, report, audit)
    result["reporte_id"] = reporte_id
    return result


def query_reports(tipo=None, limit=50, verification=None):
    return db_list_reports(limit=limit, tipo=tipo, verification=verification)

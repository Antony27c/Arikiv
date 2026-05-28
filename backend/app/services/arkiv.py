import json
import os
import time
import logging
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

ARKIV_RPC = os.getenv("ARKIV_RPC_URL", "https://braga.hoodi.arkiv.network/rpc")
ARKIV_PRIVATE_KEY = os.getenv("ARKIV_PRIVATE_KEY", "")

PROJECT_ATTRIBUTE = {"key": "project", "value": "punapulse-rn51"}

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
        },
    }, ensure_ascii=False)

def _attributes(report, audit):
    meta = report.get("metadata_origen", {})
    evento = report.get("datos_evento", {})
    geo = report.get("geolocalizacion_reportada", {})
    v = audit or {}

    return [
        PROJECT_ATTRIBUTE,
        {"key": "type", "value": "road_incident"},
        {"key": "chofer_id", "value": meta.get("chofer_id", "")},
        {"key": "tipo_incidente", "value": evento.get("tipo_incidente", "")},
        {"key": "clasificacion_urgencia", "value": v.get("clasificacion_urgencia_ia", "")},
        {"key": "status_verificacion", "value": v.get("status_verificacion", "")},
        {"key": "kilometro", "value": geo.get("kilometro", 0)},
        {"key": "timestamp", "value": int(time.time())},
    ]

def store_report(report, audit):
    payload_str = _build_payload(report, audit)
    attrs = _attributes(report, audit)

    if not ARKIV_PRIVATE_KEY:
        meta = report.get("metadata_origen", {})
        entity_key = f"0xSIM_{meta.get('chofer_id', 'unknown')}_{int(time.time())}"
        logger.info("ARKIV: modo simulación — entity_key=%s", entity_key)
        return {
            "entity_key": entity_key,
            "tx_hash": "0xSIM",
            "stored": False,
            "simulated": True,
        }

    try:
        from web3 import Web3
        from eth_account import Account

        w3 = Web3(Web3.HTTPProvider(ARKIV_RPC))
        account = Account.from_key(ARKIV_PRIVATE_KEY)

        expires_in = 30 * 24 * 3600

        payload_bytes = w3.to_bytes(text=payload_str)
        content_type_bytes = w3.to_bytes(text="application/json")

        attrs_string = json.dumps(attrs, ensure_ascii=False)
        attrs_bytes = w3.to_bytes(text=attrs_string)

        data_hex = (
            w3.to_bytes(hexstr="0x00").hex()
            + w3.to_bytes(payload_bytes).hex()
            + w3.to_bytes(content_type_bytes).hex()
            + w3.to_bytes(attrs_bytes).hex()
            + w3.to_bytes(expires_in).hex()
        )

        tx = {
            "to": ARKIV_ADDRESS,
            "from": account.address,
            "value": 0,
            "data": data_hex,
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

        return {
            "entity_key": entity_key,
            "tx_hash": tx_hash.hex(),
            "stored": True,
            "simulated": False,
        }

    except Exception as e:
        logger.error("ARKIV: error al almacenar — %s", str(e))
        return {
            "entity_key": "0xERR",
            "tx_hash": "0xERR",
            "stored": False,
            "error": str(e),
        }

def query_reports(tipo=None, limit=20):
    try:
        conditions = [f'{PROJECT_ATTRIBUTE["key"]} = "{PROJECT_ATTRIBUTE["value"]}"']
        if tipo:
            conditions.append(f'tipo_incidente = "{tipo}"')

        query = " && ".join(conditions)

        body = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "arkiv_query",
            "params": [
                query,
                {
                    "resultsPerPage": hex(limit),
                    "includeData": {
                        "key": True,
                        "payload": True,
                        "attributes": True,
                        "contentType": True,
                        "expiration": True,
                        "creator": True,
                        "owner": True,
                    },
                },
            ],
        }

        resp = requests.post(ARKIV_RPC, json=body, timeout=30)
        resp.raise_for_status()
        result = resp.json().get("result", {})
        return result.get("data", [])

    except Exception as e:
        logger.error("ARKIV: error en query — %s", str(e))
        return []

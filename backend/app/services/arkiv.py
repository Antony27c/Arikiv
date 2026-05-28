import json
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

ARKIV_RPC = os.getenv("ARKIV_RPC_URL", "https://braga.hoodi.arkiv.network/rpc")
ARKIV_PRIVATE_KEY = os.getenv("ARKIV_PRIVATE_KEY", "")
PROJECT_NAME = "punapulse"

def _build_payload(report: dict, audit: dict) -> str:
    return json.dumps({
        "project": PROJECT_NAME,
        "type": "road_audit",
        "report": {
            "driver_id": report["driver_id"],
            "latitude": report["latitude"],
            "longitude": report["longitude"],
            "description": report.get("description", ""),
            "timestamp": report.get("timestamp", ""),
            "photo_count": len(report.get("photos", [])),
        },
        "audit": {
            "trust_score": audit["trust_score"],
            "passed": audit["passed"],
            "flags": audit["flags"],
        },
        "device_id": report.get("device_id", ""),
    }, ensure_ascii=False)

def store_report(report: dict, audit: dict) -> dict:
    payload = _build_payload(report, audit)

    if not ARKIV_PRIVATE_KEY:
        entity_key = f"0xSIM_{report.get('driver_id','')}_{int(__import__('time').time())}"
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

        arkiv_address = "0x000000000000000000000000000000000061726976"
        tx = {
            "to": arkiv_address,
            "from": account.address,
            "value": 0,
            "data": w3.to_bytes(text=payload).hex(),
            "chainId": 60138453102,
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

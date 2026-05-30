import os
import json
import logging
from dotenv import load_dotenv
import httpx

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def analizar_reporte(descripcion: str, latitud: float, longitud: float) -> dict:
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("AI_MODEL_API_KEY") or ""

    if not api_key.strip():
        return {
            "tipo": None,
            "es_fraude": None,
            "en_zona": None,
            "confianza": 0.0,
            "resumen": "GROQ_API_KEY no configurada",
            "feedback": None,
            "razon_rechazo": "Servicio de IA no disponible",
        }

    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
    }

    system_prompt = (
        "Sos un sistema de filtrado de reportes para la Ruta Nacional 51, Salta, Argentina. "
        "Respondé SOLO con JSON válido, sin texto adicional, sin markdown:\n"
        "{\n"
        '  "tipo": "accidente | obra | corte | neblina | otro",\n'
        '  "es_fraude": false,\n'
        '  "en_zona": true,\n'
        '  "confianza": 0.90,\n'
        '  "resumen": "resumen breve",\n'
        '  "feedback": "Explicá qué está pasando y dá 2 recomendaciones concretas para conductores.",\n'
        '  "razon_rechazo": null\n'
        "}"
    )

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": f"Reporte: {descripcion}. Coordenadas: lat {latitud}, lon {longitud}",
            },
        ],
        "temperature": 0.3,
        "max_tokens": 500,
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(GROQ_API_URL, headers=headers, json=payload)

        if response.status_code != 200:
            logger.error("Groq HTTP %s: %s", response.status_code, response.text)
            return {
                "tipo": None,
                "es_fraude": None,
                "en_zona": None,
                "confianza": 0.0,
                "resumen": f"Error de Groq: {response.status_code}",
                "feedback": None,
                "razon_rechazo": f"HTTP {response.status_code}",
            }

        data = response.json()
        texto = data["choices"][0]["message"]["content"].strip()
        texto_limpio = texto.replace("```json", "").replace("```", "").strip()
        result = json.loads(texto_limpio)

        logger.info(
            "Groq OK — tipo=%s fraude=%s en_zona=%s confianza=%.2f",
            result.get("tipo"), result.get("es_fraude"),
            result.get("en_zona"), result.get("confianza", 0),
        )
        return result

    except Exception as e:
        logger.error("Groq error: %s", str(e))
        return {
            "tipo": None,
            "es_fraude": None,
            "en_zona": None,
            "confianza": 0.0,
            "resumen": f"Error de IA: {str(e)}",
            "feedback": None,
            "razon_rechazo": "Error al procesar con Groq",
        }

import os
import json
import logging
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


def analizar_reporte(descripcion: str, latitud: float, longitud: float) -> dict:
    if not GROQ_API_KEY:
        return {
            "tipo": None,
            "es_fraude": None,
            "en_zona": None,
            "confianza": 0.0,
            "resumen": "GROQ_API_KEY no configurada",
            "feedback": None,
            "razon_rechazo": "Servicio de IA no disponible",
        }

    system_prompt = (
        "Sos un sistema de filtrado de reportes ciudadanos para la Ruta 51 y su zona de influencia. "
        "Dado un reporte, respondé SOLO en JSON con este formato:\n"
        "{\n"
        '  "tipo": "accidente | obra | corte | otro",\n'
        '  "es_fraude": true | false,\n'
        '  "en_zona": true | false,\n'
        '  "confianza": 0.0 a 1.0,\n'
        '  "resumen": "resumen en una oración",\n'
        '  "feedback": "2 oraciones máximo: explicá qué está pasando en el reporte y recomendá cómo actuar. Ejemplo: \'Se detectó un derrumbe en km 45 de RN 51 con alta probabilidad de corte total. Se recomienda alertar a vialidad provincial y desviar tránsito por ruta alternativa.\'",\n'
        '  "razon_rechazo": "motivo si es fraude o fuera de zona, sino null"\n'
        "}\n\n"
        "Coordenadas válidas para Ruta 51: latitud entre -24.5 y -23.0, longitud entre -66.5 y -64.5.\n"
        "Considerá fraude si: descripción vaga, sin detalles reales, repetida, o incoherente."
    )

    user_prompt = (
        f"Reporte:\n"
        f"Descripción: {descripcion}\n"
        f"Latitud: {latitud}\n"
        f"Longitud: {longitud}"
    )

    try:
        client = _get_client()
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        content = completion.choices[0].message.content
        result = json.loads(content)

        logger.info(
            "Groq analisis OK — tipo=%s fraude=%s en_zona=%s confianza=%.2f",
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

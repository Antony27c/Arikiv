import os
import json
import logging
from groq import Groq

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


def analizar_reporte(texto: str) -> dict:
    if not GROQ_API_KEY:
        return {"error": "GROQ_API_KEY no configurada", "analisis": None}

    system_prompt = (
        "Sos un analista de reportes viales para la Ruta Nacional 51 en Salta, Argentina. "
        "Analizás el texto de un reporte de incidente y devolvés un análisis estructurado. "
        "Respondé SOLO con un objeto JSON válido, sin markdown ni texto adicional.\n\n"
        "Campos del JSON:\n"
        "- clasificacion: 'CRÍTICA' | 'ALTA' | 'MODERADA' | 'BAJA'\n"
        "- resumen: resumen breve del incidente (máx 2 oraciones)\n"
        "- palabras_clave: lista de palabras clave detectadas\n"
        "- coherencia: 'COHERENTE' | 'INCOHERENTE' | 'DUDOSO'\n"
        "- observacion: una oración explicando el análisis\n"
        "- score_confianza: número entre 0.0 y 1.0"
    )

    try:
        client = _get_client()
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analizá este reporte:\n\n{texto}"},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        content = completion.choices[0].message.content
        result = json.loads(content)

        logger.info("Groq analisis OK — clasificacion=%s", result.get("clasificacion"))
        return {"error": None, "analisis": result}

    except Exception as e:
        logger.error("Groq error: %s", str(e))
        return {"error": str(e), "analisis": None}

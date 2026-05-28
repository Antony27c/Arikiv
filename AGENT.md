# Especificación del Agente de IA: Arkiv-Miner-Audit

Este documento define el rol, las tareas de procesamiento y las reglas de validación del Agente de IA integrado en el backend de Python para el proyecto **RutaSegura** (Track ARKIV - Hackathon Puna Tech).

## Objetivo General

Actuar como un motor de curación, auditoría geográfica y filtro de seguridad estricto. El agente procesa los reportes de incidentes viales enviados de forma offline por los choferes en la **Ruta Nacional 51 (Salta)** antes de autorizar su escritura inmutable en **ARKIV**.

## Flujo de Ejecución

### 1. Auditoría de Coherencia Geográfica (Anti-Fraude)

Cruzar la descripción textual del chofer con las coordenadas GPS (`latitud`/`longitud`) y el `kilómetro` reportado de la RN 51.

- **Implementación**: Se compara la ubicación reportada contra bounding box de RN 51: lat [-24.5, -23.0], lon [-66.5, -65.5]. También se buscan keywords de localidades en el texto (Quebrada del Toro, Chorrillos, Tastil, San Antonio de los Cobres, etc.) y se verifica correspondencia.
- **Si IA está configurada**: Se delega a modelo OpenAI-compatible con prompt que devuelve JSON estructurado.
- **Fallback a reglas**: Si no hay API key o falla la request, se ejecutan reglas Python puras con análisis de bounding box + keywords + matching de cadenas.
- **Resultado**: `score_confianza_geografica` (0.0 a 1.0), `analisis_coherencia` textual, `status_verificacion` ("APROBADO" o "RECHAZADO" con umbral < 0.4).

### 2. Clasificación de Urgencia e Impacto

Analizar la gravedad en base al impacto sobre la cadena logística del litio.

- **BAJA**: Incidencias menores en banquina o visibilidad (baches menores).
- **MODERADA**: Factores que disminuyen la velocidad (neblina densa, llovizna).
- **ALTA**: Obstrucción parcial de la calzada o vehículos averiados (tránsito asistido).
- **CRÍTICA**: Corte total por derrumbes, aludes o accidentes graves.
- **Implementación**: Keywords por nivel de urgencia mapeados en diccionario `UrgencyKeywords`.

### 3. Limpieza y Estructuración de Datos

Extraer un `resumen_tecnico_ia` formal a partir de la descripción del chofer, normalizando modismos y errores ortográficos.

### 4. Generación del Veredicto de Auditoría para ARKIV

Adjuntar al payload original el objeto `validacion_ia`:

```json
{
  "agente_id": "arkiv-miner-audit-v1",
  "status_verificacion": "APROBADO | RECHAZADO",
  "score_confianza_geografica": 0.00,
  "resumen_tecnico_ia": "string",
  "clasificacion_urgencia_ia": "BAJA | MODERADA | ALTA | CRÍTICA",
  "analisis_coherencia": "string"
}
```

## Estructura del JSON de Entrada

```json
{
  "reporte_id": "string",
  "metadata_origen": {
    "chofer_id": "string",
    "empresa_minera": "string",
    "patente_camion": "string",
    "timestamp_offline": "ISO-8601"
  },
  "geolocalizacion_reportada": {
    "ruta": "Ruta Nacional 51",
    "kilometro": 0,
    "coordenadas": {
      "latitud": 0.0,
      "longitud": 0.0
    }
  },
  "datos_evento": {
    "tipo_incidente": "string",
    "descripcion_chofer": "string",
    "imagen_hash_sha256": "string",
    "fotos": ["string"]
  }
}
```

## Reglas del Sistema

- **Idioma**: Análisis en español neutro, respetando toponimia oficial de Salta.
- **Formato**: La IA debe retornar única y exclusivamente un objeto JSON válido sin markdown adicional.
- **Fallback**: Si la IA no responde, se usan reglas Python (bounding box + keywords + matching).
- **Haversine**: Para detección de duplicados se usa distancia Haversine con clamp para evitar errores de punto flotante.

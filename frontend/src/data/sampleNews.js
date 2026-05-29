const sampleNews = [
  {
    _id: "sample-1", _queuedAt: "2026-05-27T08:30:00Z",
    _result: {
      status: "aprobado", reporte_id: "RP-1712345601",
      validacion_ia: {
        agente_id: "arkiv-miner-audit-v1", status_verificacion: "APROBADO",
        score_confianza_geografica: 0.92, clasificacion_urgencia_ia: "CRÍTICA",
        resumen_tecnico_ia: "Reporte en RN 51, km 45. Tipo: Derrumbe. Desprendimiento de rocas de gran tamaño bloquea ambos carriles. Tránsito detenido totalmente. Se requiere maquinaria pesada para remoción.",
        analisis_coherencia: "El derrumbe en km 45 está dentro del corredor de RN 51, ubicación confirmada en zona de quebrada.",
      },
      arkiv: { entity_key: "0xSIM_CHO-001_1712345601", simulated: true, stored: false },
    },
    metadata_origen: { chofer_id: "CHO-001", empresa_minera: "Lithium Americas", patente_camion: "AA123BB" },
    geolocalizacion_reportada: { kilometro: 45, coordenadas: { latitud: -24.183, longitud: -66.312 } },
    datos_evento: { tipo_incidente: "Derrumbe", descripcion_chofer: "Derrumbe grande en la subida, piedras tapando toda la ruta" },
  },
  {
    _id: "sample-2", _queuedAt: "2026-05-27T09:15:00Z",
    _result: {
      status: "aprobado", reporte_id: "RP-1712345602",
      validacion_ia: {
        agente_id: "arkiv-miner-audit-v1", status_verificacion: "APROBADO",
        score_confianza_geografica: 0.88, clasificacion_urgencia_ia: "ALTA",
        resumen_tecnico_ia: "Reporte en RN 51, km 32. Tipo: Neblina. Banco de niebla densa reduce visibilidad a menos de 10 metros. Circular a velocidad mínima con balizas encendidas.",
        analisis_coherencia: "La neblina en km 32 está dentro del corredor de RN 51, zona de altura propensa a niebla.",
      },
      arkiv: { entity_key: "0xSIM_CHO-003_1712345602", simulated: true, stored: false },
    },
    metadata_origen: { chofer_id: "CHO-003", empresa_minera: "Sales de Jujuy", patente_camion: "BC456CD" },
    geolocalizacion_reportada: { kilometro: 32, coordenadas: { latitud: -24.256, longitud: -66.178 } },
    datos_evento: { tipo_incidente: "Neblina", descripcion_chofer: "Neblina muy cerrada, no se ve nada, casi choco con otro camión" },
  },
  {
    _id: "sample-3", _queuedAt: "2026-05-27T10:00:00Z",
    _result: {
      status: "rechazado", reporte_id: "RP-1712345603",
      validacion_ia: {
        agente_id: "arkiv-miner-audit-v1", status_verificacion: "RECHAZADO",
        score_confianza_geografica: 0.15, clasificacion_urgencia_ia: "BAJA",
        resumen_tecnico_ia: "Reporte en RN 51. Tipo: Bache. Pequeño pozo en banquina.",
        analisis_coherencia: "El bache menciona 'quebrada del toro' pero las coordenadas caen en Salta Capital, posible fraude.",
      },
      arkiv: { entity_key: "0xSIM_CHO-007_1712345603", simulated: true, stored: false },
    },
    metadata_origen: { chofer_id: "CHO-007", empresa_minera: "Minera del Altip", patente_camion: "DE789EF" },
    geolocalizacion_reportada: { kilometro: 5, coordenadas: { latitud: -24.783, longitud: -65.412 } },
    datos_evento: { tipo_incidente: "Bache", descripcion_chofer: "Bache chico en la banquina, nada grave" },
  },
  {
    _id: "sample-4", _queuedAt: "2026-05-27T11:00:00Z",
    _result: {
      status: "aprobado", reporte_id: "RP-1712345604",
      validacion_ia: {
        agente_id: "arkiv-miner-audit-v1", status_verificacion: "APROBADO",
        score_confianza_geografica: 0.75, clasificacion_urgencia_ia: "MODERADA",
        resumen_tecnico_ia: "Reporte en RN 51, km 28. Tipo: Lluvia. Calzada mojada con principio de hidroplaneo en curva pronunciada. Reducir velocidad y mantener distancia de seguridad.",
        analisis_coherencia: "La lluvia en km 28 corresponde a zona de pendiente con curvas, coherente con el报告.",
      },
      arkiv: { entity_key: "0xSIM_CHO-005_1712345604", simulated: true, stored: false },
    },
    metadata_origen: { chofer_id: "CHO-005", empresa_minera: "Litio Andino S.A.", patente_camion: "GH789IJ" },
    geolocalizacion_reportada: { kilometro: 28, coordenadas: { latitud: -24.841, longitud: -65.583 } },
    datos_evento: { tipo_incidente: "Lluvia", descripcion_chofer: "Lluvia moderada, la ruta está resbaladiza en las curvas" },
  },
  {
    _id: "sample-5", _queuedAt: "2026-05-27T12:30:00Z",
    _result: {
      status: "aprobado", reporte_id: "RP-1712345605",
      validacion_ia: {
        agente_id: "arkiv-miner-audit-v1", status_verificacion: "APROBADO",
        score_confianza_geografica: 0.81, clasificacion_urgencia_ia: "BAJA",
        resumen_tecnico_ia: "Reporte en RN 51, km 52. Tipo: Señalización dañada. Cartel indicador de curva peligrosa caído a la banquina. No representa riesgo inmediato pero debe reponerse.",
        analisis_coherencia: "La señalización dañada en km 52 está dentro del corredor de RN 51, zona de curvas.",
      },
      arkiv: { entity_key: "0xSIM_CHO-009_1712345605", simulated: true, stored: false },
    },
    metadata_origen: { chofer_id: "CHO-009", empresa_minera: "Minera del Altip", patente_camion: "JK012LM" },
    geolocalizacion_reportada: { kilometro: 52, coordenadas: { latitud: -24.662, longitud: -65.879 } },
    datos_evento: { tipo_incidente: "Señalización dañada", descripcion_chofer: "Cartel de curva tirado en la banquina, casi me lo como" },
  },
];

export default sampleNews;

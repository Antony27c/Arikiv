const sampleNews = [
  {
    _id: "sample-1", _queuedAt: "2026-05-27T08:30:00Z",
    _result: {
      status: "aprobado", reporte_id: "RP-1712345601",
      validacion_ia: {
        agente_id: "arkiv-miner-audit-v1", status_verificacion: "APROBADO",
        score_confianza_geografica: 0.92, clasificacion_urgencia_ia: "CRÍTICA",
        resumen_tecnico_ia: "Reporte en RN 51, km 45. Tipo: Derrumbe. Desprendimiento de rocas de gran tamaño bloquea ambos carriles. Tránsito detenido totalmente. Se requiere maquinaria pesada para remoción.",
        analisis_coherencia: "Coordenadas coherentes con la Ruta Nacional 51. Ubicación confirmada en zona de quebrada.",
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
        analisis_coherencia: "Coordenadas coherentes con la Ruta Nacional 51. Zona de altura propensa a neblina.",
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
        analisis_coherencia: "El texto describe locaciones de la Puna pero las coordenadas corresponden a Salta Capital. Posible fraude.",
      },
      arkiv: { entity_key: "0xSIM_CHO-007_1712345603", simulated: true, stored: false },
    },
    metadata_origen: { chofer_id: "CHO-007", empresa_minera: "Minera del Altip", patente_camion: "DE789EF" },
    geolocalizacion_reportada: { kilometro: 5, coordenadas: { latitud: -24.783, longitud: -65.412 } },
    datos_evento: { tipo_incidente: "Bache", descripcion_chofer: "Bache chico en la banquina, nada grave" },
  },
  {
    _id: "sample-4", _queuedAt: "2026-05-28T07:00:00Z",
    _result: {
      status: "aprobado", reporte_id: "RP-1712345604",
      validacion_ia: {
        agente_id: "arkiv-miner-audit-v1", status_verificacion: "APROBADO",
        score_confianza_geografica: 0.95, clasificacion_urgencia_ia: "MODERADA",
        resumen_tecnico_ia: "Reporte en RN 51, km 78. Tipo: Animal suelto. Tropa de llamas cruzando la calzada a la altura del puesto. Reducir velocidad extremadamente.",
        analisis_coherencia: "Coordenadas coherentes con la Ruta Nacional 51.",
      },
      arkiv: { entity_key: "0xSIM_CHO-002_1712345604", simulated: true, stored: false },
    },
    metadata_origen: { chofer_id: "CHO-002", empresa_minera: "Lithium Americas", patente_camion: "FG012GH" },
    geolocalizacion_reportada: { kilometro: 78, coordenadas: { latitud: -23.654, longitud: -65.891 } },
    datos_evento: { tipo_incidente: "Animal suelto", descripcion_chofer: "Llamas en la ruta, cuidado al pasar" },
  },
  {
    _id: "sample-5", _queuedAt: "2026-05-28T11:30:00Z",
    _result: {
      status: "aprobado", reporte_id: "RP-1712345605",
      validacion_ia: {
        agente_id: "arkiv-miner-audit-v1", status_verificacion: "APROBADO",
        score_confianza_geografica: 0.91, clasificacion_urgencia_ia: "CRÍTICA",
        resumen_tecnico_ia: "Reporte en RN 51, km 53. Tipo: Accidente. Camión volcado con derrame de baterías de litio. Carga peligrosa. Evacuar zona. Bomberos en camino.",
        analisis_coherencia: "Coordenadas coherentes con la Ruta Nacional 51. Curva peligrosa conocida como 'La Cuesta'.",
      },
      arkiv: { entity_key: "0xSIM_CHO-005_1712345605", simulated: true, stored: false },
    },
    metadata_origen: { chofer_id: "CHO-005", empresa_minera: "Eramine", patente_camion: "HI345IJ" },
    geolocalizacion_reportada: { kilometro: 53, coordenadas: { latitud: -24.087, longitud: -66.201 } },
    datos_evento: { tipo_incidente: "Accidente", descripcion_chofer: "Camión volcado en la curva, se están saliendo las baterías, llamen a emergencias" },
  },
  {
    _id: "sample-6", _queuedAt: "2026-05-28T13:00:00Z",
    _result: {
      status: "aprobado", reporte_id: "RP-1712345606",
      validacion_ia: {
        agente_id: "arkiv-miner-audit-v1", status_verificacion: "APROBADO",
        score_confianza_geografica: 0.87, clasificacion_urgencia_ia: "ALTA",
        resumen_tecnico_ia: "Reporte en RN 51, km 22. Tipo: Vehículo averiado. Camión de minera descompuesto ocupando media calzada a la salida del pueblo. Transitar con precaución.",
        analisis_coherencia: "Coordenadas coherentes con la Ruta Nacional 51.",
      },
      arkiv: { entity_key: "0xSIM_CHO-006_1712345606", simulated: true, stored: false },
    },
    metadata_origen: { chofer_id: "CHO-006", empresa_minera: "Sales de Jujuy", patente_camion: "JK678KL" },
    geolocalizacion_reportada: { kilometro: 22, coordenadas: { latitud: -24.389, longitud: -66.045 } },
    datos_evento: { tipo_incidente: "Vehículo averiado", descripcion_chofer: "Camión parado en la ruta, medio carril tapado" },
  },
];

export default sampleNews;

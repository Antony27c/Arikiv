const urgencyColors = {
  CRÍTICA: "#e63946",
  ALTA: "#f77f00",
  MODERADA: "#fcbf49",
  BAJA: "#2a9d8f",
};

const statusColors = {
  aprobado: "#2a9d8f",
  rechazado: "#e63946",
  flagged: "#f77f00",
};

export default function NewsFeed({ synced, pending }) {
  const all = [...synced].reverse();

  return (
    <div>
      {all.length === 0 && pending.length === 0 && (
        <div className="pw-card" style={{ textAlign: "center", padding: 32, borderLeft: "none" }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📡</p>
          <p style={{ color: "#666", fontSize: 14 }}>No hay incidentes reportados aún.</p>
          <p style={{ color: "#999", fontSize: 13, marginTop: 4 }}>Reportá el primero desde "Reportar"</p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="pw-section">
          <h3 className="pw-section-title">Pendientes de envío</h3>
          {pending.map((p) => (
            <div key={p._id} className="pw-card" style={{ borderLeftColor: "#fcbf49", opacity: 0.8 }}>
              <div className="pw-card-header">
                <strong style={{ fontSize: 13 }}>{p.metadata_origen?.chofer_id}</strong>
                <span style={{ fontSize: 11, color: "#fcbf49", fontWeight: 600 }}>OFFLINE</span>
              </div>
              <div className="pw-card-body">
                <span>{p.datos_evento?.tipo_incidente}</span>
                <span>Km {p.geolocalizacion_reportada?.kilometro || "?"}</span>
              </div>
              <div className="pw-card-footer">
                {p.geolocalizacion_reportada?.coordenadas?.latitud?.toFixed(4)}, {p.geolocalizacion_reportada?.coordenadas?.longitud?.toFixed(4)}
              </div>
            </div>
          ))}
        </section>
      )}

      {all.length > 0 && (
        <section className="pw-section">
          <h3 className="pw-section-title">Noticias de incidentes</h3>
          {all.map((s) => {
            const v = s._result?.validacion_ia;
            const a = s._result?.arkiv;
            const meta = s.metadata_origen || {};
            const geo = s.geolocalizacion_reportada || {};
            const evento = s.datos_evento || {};

            return (
              <div key={s._id} className="pw-card" style={{
                borderLeftColor: statusColors[s._result?.status] || "#2a9d8f",
              }}>
                <div className="pw-card-header">
                  <strong style={{ fontSize: 13, color: statusColors[s._result?.status] || "#2a9d8f" }}>
                    {evento.tipo_incidente || "Incidente"}
                  </strong>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {v?.clasificacion_urgencia_ia && (
                      <span style={{
                        fontSize: 10, padding: "2px 10px", borderRadius: 12, color: "#fff",
                        fontWeight: 700, background: urgencyColors[v.clasificacion_urgencia_ia] || "#999",
                      }}>
                        {v.clasificacion_urgencia_ia}
                      </span>
                    )}
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 12,
                      background: s._result?.status === "aprobado" ? "#d4edda" : "#f8d7da",
                      color: s._result?.status === "aprobado" ? "#155724" : "#721c24",
                      fontWeight: 600,
                    }}>
                      {s._result?.status === "aprobado" ? "APROBADO" : "RECHAZADO"}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "#555", marginBottom: 6, lineHeight: 1.5 }}>
                  {v?.resumen_tecnico_ia || evento.descripcion_chofer || "Sin descripción"}
                </div>

                <div className="pw-card-body" style={{ fontSize: 12 }}>
                  <span>{meta.chofer_id}</span>
                  <span>Km {geo.kilometro || "?"} · RN 51</span>
                </div>

                {v?.analisis_coherencia && (
                  <div className="pw-card-footer" style={{
                    color: s._result?.status === "aprobado" ? "#2a9d8f" : "#e63946",
                  }}>
                    {v.analisis_coherencia}
                  </div>
                )}

                <div className="pw-card-body" style={{ marginTop: 6, fontSize: 11, color: "#999" }}>
                  <span>Score: {Math.round((v?.score_confianza_geografica || 0) * 100)}%</span>
                  <span>{a?.simulated ? "🔬 Simulado" : "🔗 ARKIV"}</span>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

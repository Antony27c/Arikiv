import ReportForm from "./components/ReportForm";
import { useOfflineSync } from "./hooks/useOfflineSync";

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

function App() {
  const { pending, synced, online, syncing, enqueue, sync } = useOfflineSync();

  return (
    <div className="pw-wrapper" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: "#f0f2f5" }}>
      <header className="pw-header">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>PunaPulse</h1>
          <span style={{
            fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: 0.5,
            background: online ? "#2a9d8f" : "#e63946", color: "#fff",
          }}>
            {online ? "Online" : "Offline"}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#a0a0b0", margin: "4px 0 12px" }}>Auditoría Vial Inmutable — RN 51</p>
        <div className="pw-stats">
          <span style={{ color: "#ccc" }}>&#128337; {pending.length} pendientes</span>
          <span style={{ color: "#ccc" }}>&#9989; {synced.length} sincronizados</span>
        </div>
        {pending.length > 0 && online && (
          <button onClick={sync} disabled={syncing} style={{
            marginTop: 12, padding: "10px 24px", background: "#4361ee",
            color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
            fontWeight: 600, fontSize: 14, minHeight: 44,
          }}>
            {syncing ? "Sincronizando..." : `Sincronizar ${pending.length} reportes`}
          </button>
        )}
      </header>

      <ReportForm onSave={enqueue} />

      {synced.length > 0 && (
        <section className="pw-section">
          <h3 className="pw-section-title">Últimos sincronizados</h3>
          {synced.slice(-5).reverse().map((s) => {
            const v = s._result?.validacion_ia;
            const a = s._result?.arkiv;
            return (
              <div key={s._id} className="pw-card" style={{ borderLeftColor: statusColors[s._result?.status] || "#666" }}>
                <div className="pw-card-header">
                  <strong style={{ color: statusColors[s._result?.status] || "#666", fontSize: 13 }}>
                    {s._result?.reporte_id}
                  </strong>
                  {v?.clasificacion_urgencia_ia && (
                    <span style={{
                      fontSize: 10, padding: "2px 10px", borderRadius: 12, color: "#fff",
                      fontWeight: 700, letterSpacing: 0.3, whiteSpace: "nowrap",
                      background: urgencyColors[v.clasificacion_urgencia_ia] || "#999",
                    }}>
                      {v.clasificacion_urgencia_ia}
                    </span>
                  )}
                </div>
                <div className="pw-card-body">
                  <span>Score: {Math.round((v?.score_confianza_geografica || 0) * 100)}%</span>
                  <span>{a?.simulated ? "Simulado" : "ARKIV"}</span>
                </div>
                {v?.analisis_coherencia && (
                  <div className="pw-card-footer">{v.analisis_coherencia}</div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {pending.length > 0 && (
        <section className="pw-section">
          <h3 className="pw-section-title">Pendientes (offline)</h3>
          {pending.map((p) => (
            <div key={p._id} className="pw-card" style={{ borderLeftColor: "#fcbf49" }}>
              <div className="pw-card-header">
                <strong style={{ fontSize: 13 }}>{p.metadata_origen?.chofer_id}</strong>
                <span style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>
                  {p.datos_evento?.tipo_incidente}
                </span>
              </div>
              <div className="pw-card-body">
                <span>{p.geolocalizacion_reportada?.coordenadas?.latitud?.toFixed(4)}, {p.geolocalizacion_reportada?.coordenadas?.longitud?.toFixed(4)}</span>
                <span>Km {p.geolocalizacion_reportada?.kilometro || "?"}</span>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default App;

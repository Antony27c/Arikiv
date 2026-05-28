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
    <div style={s.wrapper}>
      <header style={s.header}>
        <div style={s.headerTop}>
          <h1 style={s.logo}>PunaPulse</h1>
          <span style={{ ...s.badge, background: online ? "#2a9d8f" : "#e63946" }}>
            {online ? "Online" : "Offline"}
          </span>
        </div>
        <p style={s.subtitle}>Auditoría Vial Inmutable — RN 51</p>
        <div style={s.stats}>
          <span style={s.stat}>&#128337; {pending.length} pendientes</span>
          <span style={s.stat}>&#9989; {synced.length} sincronizados</span>
        </div>
        {pending.length > 0 && online && (
          <button onClick={sync} disabled={syncing} style={s.syncBtn}>
            {syncing ? "Sincronizando..." : `Sincronizar ${pending.length} reportes`}
          </button>
        )}
      </header>

      <ReportForm onSave={enqueue} />

      {synced.length > 0 && (
        <section style={s.section}>
          <h3 style={s.sectionTitle}>Últimos sincronizados</h3>
          {synced.slice(-5).reverse().map((s) => {
            const v = s._result?.validacion_ia;
            const a = s._result?.arkiv;
            return (
              <div key={s._id} style={s.card}>
                <div style={s.cardHeader}>
                  <strong style={{ color: statusColors[s._result?.status] || "#666" }}>
                    {s._result?.reporte_id}
                  </strong>
                  {v?.clasificacion_urgencia_ia && (
                    <span style={{ ...s.urgencyBadge, background: urgencyColors[v.clasificacion_urgencia_ia] || "#999" }}>
                      {v.clasificacion_urgencia_ia}
                    </span>
                  )}
                </div>
                <div style={s.cardBody}>
                  <span>Score: {Math.round((v?.score_confianza_geografica || 0) * 100)}%</span>
                  <span>{a?.simulated ? "Simulado" : "ARKIV"}</span>
                </div>
                {v?.analisis_coherencia && (
                  <div style={s.cardFooter}>{v.analisis_coherencia}</div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {pending.length > 0 && (
        <section style={s.section}>
          <h3 style={s.sectionTitle}>Pendientes (offline)</h3>
          {pending.map((p) => (
            <div key={p._id} style={{ ...s.card, borderLeft: "4px solid #fcbf49" }}>
              <div style={s.cardHeader}>
                <strong>{p.metadata_origen?.chofer_id}</strong>
                <span style={{ fontSize: 12, color: "#666" }}>
                  {p.datos_evento?.tipo_incidente}
                </span>
              </div>
              <div style={s.cardBody}>
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

const s = {
  wrapper: {
    maxWidth: 500, margin: "0 auto", padding: "16px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    background: "#f0f2f5", minHeight: "100vh",
  },
  header: {
    textAlign: "center", marginBottom: 20, padding: "20px 16px",
    background: "linear-gradient(135deg, #1a1a2e, #16213e)",
    borderRadius: 12, color: "#fff",
  },
  headerTop: { display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 4 },
  logo: { fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: -0.5 },
  badge: {
    fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  subtitle: { fontSize: 13, color: "#a0a0b0", margin: "4px 0 12px" },
  stats: { display: "flex", justifyContent: "center", gap: 16, fontSize: 13 },
  stat: { color: "#ccc" },
  syncBtn: {
    marginTop: 12, padding: "8px 20px", background: "#4361ee",
    color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
    fontWeight: 600, fontSize: 14, fontFamily: "inherit",
  },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: "#1a1a2e", margin: "0 0 8px" },
  card: {
    padding: "10px 14px", margin: "6px 0", background: "#fff",
    borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    borderLeft: "4px solid #2a9d8f",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardBody: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555" },
  cardFooter: { fontSize: 12, color: "#777", marginTop: 4, fontStyle: "italic" },
  urgencyBadge: {
    fontSize: 10, padding: "1px 8px", borderRadius: 12, color: "#fff",
    fontWeight: 700, letterSpacing: 0.3,
  },
};

export default App;

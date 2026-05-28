import ReportForm from "./components/ReportForm";
import { useOfflineSync } from "./hooks/useOfflineSync";

function App() {
  const { pending, synced, online, syncing, enqueue, sync } = useOfflineSync();

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>PunaPulse</h1>
        <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Auditoría Vial — RN 51</p>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 12, fontSize: 13 }}>
          <span style={{ color: online ? "#0a0" : "#a00" }}>
            {online ? "● Online" : "● Offline"}
          </span>
          <span>{pending.length} pendientes</span>
          <span>{synced.length} sincronizados</span>
        </div>
        {pending.length > 0 && online && (
          <button onClick={sync} disabled={syncing} style={{ marginTop: 8, padding: "6px 16px", background: "#0055ff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
            {syncing ? "Sincronizando..." : `Sincronizar ${pending.length} reportes`}
          </button>
        )}
      </header>

      <ReportForm onSave={enqueue} />

      {synced.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16 }}>Últimos sincronizados</h3>
          {synced.slice(-5).reverse().map((s) => (
            <div key={s._id} style={{ padding: 8, margin: "4px 0", background: "#e8ffe8", borderRadius: 4, fontSize: 13 }}>
              <strong>{s._result?.report_id}</strong> — score: {s._result?.audit?.trust_score} — {s._result?.arkiv?.simulated ? "🔬" : "🔗"} {s._result?.arkiv?.entity_key?.slice(0, 18)}…
            </div>
          ))}
        </section>
      )}

      {pending.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16 }}>Pendientes (offline)</h3>
          {pending.map((p) => (
            <div key={p._id} style={{ padding: 8, margin: "4px 0", background: "#fff3cd", borderRadius: 4, fontSize: 13 }}>
              ⏳ {p.driver_id} — ({p.latitude}, {p.longitude})
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default App;

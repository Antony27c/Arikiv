import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useOfflineSync } from "./hooks/useOfflineSync";
import NewsFeed from "./pages/NewsFeed";
import ReportPage from "./pages/ReportPage";

function AppContent() {
  const { pending, synced, online, syncing, enqueue, sync } = useOfflineSync();

  return (
    <div className="pw-wrapper" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: "#f0f2f5", display: "flex", flexDirection: "column" }}>
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
        <p style={{ fontSize: 13, color: "#a0a0b0", margin: "4px 0 8px" }}>Auditoría Vial Inmutable — RN 51</p>
        <div className="pw-stats">
          <span style={{ color: "#ccc" }}>&#128337; {pending.length} pendientes</span>
          <span style={{ color: "#ccc" }}>&#9989; {synced.length} sincronizados</span>
        </div>
        {pending.length > 0 && online && (
          <button onClick={sync} disabled={syncing} style={{
            marginTop: 10, padding: "10px 24px", background: "#4361ee",
            color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
            fontWeight: 600, fontSize: 14, minHeight: 44,
          }}>
            {syncing ? "Sincronizando..." : `Sincronizar ${pending.length} reportes`}
          </button>
        )}
      </header>

      <main style={{ flex: 1, paddingBottom: 80 }}>
        <Routes>
          <Route path="/" element={<NewsFeed synced={synced} pending={pending} />} />
          <Route path="/reportar" element={<ReportPage onSave={enqueue} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        display: "flex", background: "#fff", borderTop: "1px solid #dee2e6",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.05)", zIndex: 100,
      }}>
        <NavLink to="/" end style={navLinkStyle} className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
          {({ isActive }) => (
            <span className="pw-nav-label" style={{ color: isActive ? "#4361ee" : "#868e96" }}>
              📰 Noticias
            </span>
          )}
        </NavLink>
        <NavLink to="/reportar" style={navLinkStyle} className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
          {({ isActive }) => (
            <span className="pw-nav-label" style={{ color: isActive ? "#4361ee" : "#868e96" }}>
              🚨 Reportar
            </span>
          )}
        </NavLink>
      </nav>
    </div>
  );
}

const navLinkStyle = {
  flex: 1, textAlign: "center", padding: "10px 0", textDecoration: "none",
  fontSize: 13, fontWeight: 600,
};

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

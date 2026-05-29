import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useOfflineSync } from "./hooks/useOfflineSync";
import NewsFeed from "./pages/NewsFeed";
import ReportPage from "./pages/ReportPage";

function AppContent() {
  const { pending, synced, online, syncing, enqueue, sync } = useOfflineSync();

  return (
    <div className="pw-wrapper">
      <div className="pw-side-mountain" />
      <header className="pw-header">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <h1>RutaSegura</h1>
          <span style={{
            fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: 0.5,
            background: online ? "var(--baja)" : "var(--critica)", color: "#fff",
          }}>
            {online ? "Online" : "Offline"}
          </span>
        </div>
        <p className="subtitle">Auditoría Vial Inmutable — RN 51</p>
        <div className="pw-stats">
          <span>&#128337; {pending.length} pendientes</span>
          <span>&#9989; {synced.length} sincronizados</span>
        </div>
        {pending.length > 0 && online && (
          <button onClick={sync} disabled={syncing} className="pw-sync-btn">
            {syncing ? "Sincronizando..." : `Sincronizar ${pending.length} reportes`}
          </button>
        )}
      </header>

      {/* Desktop navigation */}
      <nav className="pw-desktop-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
          <span className="pw-nav-label">📰 Noticias</span>
        </NavLink>
        <NavLink to="/reportar" className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
          <span className="pw-nav-label">🚨 Reportar</span>
        </NavLink>
      </nav>

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<NewsFeed synced={synced} pending={pending} />} />
          <Route path="/reportar" element={<ReportPage onSave={enqueue} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="pw-mobile-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        display: "flex", background: "var(--blanco)", borderTop: "1px solid var(--borde)",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.05)", zIndex: 100,
      }}>
        <NavLink to="/" end style={navLinkStyle} className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
          {({ isActive }) => (
            <span className="pw-nav-label" style={{ color: isActive ? "var(--bordo)" : "var(--texto-secundario)" }}>
              📰 Noticias
            </span>
          )}
        </NavLink>
        <NavLink to="/reportar" style={navLinkStyle} className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
          {({ isActive }) => (
            <span className="pw-nav-label" style={{ color: isActive ? "var(--bordo)" : "var(--texto-secundario)" }}>
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

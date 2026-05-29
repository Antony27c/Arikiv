import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useOfflineSync } from "./hooks/useOfflineSync";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NewsFeed from "./pages/NewsFeed";
import ReportPage from "./pages/ReportPage";
import LoginPage from "./pages/LoginPage";
import AdminPanel from "./pages/AdminPanel";

function AppContent() {
  const { user, logout } = useAuth();
  const { pending, synced, online, syncing, enqueue, sync, clearSynced } = useOfflineSync();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="pw-wrapper">
      <header className="pw-header">
        <div className="pw-header-left">
          <span className="pw-logo">RutaSegura</span>
          <span className="pw-chip">RN 51</span>
        </div>
        <div className="pw-header-right">
          <div className="pw-header-stats">
            {user.isAdmin && <span>↑{pending.length}</span>}
            {user.isAdmin && <span>✓{synced.length}</span>}
          </div>
          <span className={`pw-dot ${online ? "online" : "offline"}`} />
          <button onClick={logout} style={{
            background: "var(--surface2)", border: "1px solid var(--border)", cursor: "pointer",
            fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
            color: "var(--text2)", transition: "all 0.2s",
          }}>
            {user.nombre}
          </button>
        </div>
      </header>
      {user.isAdmin && pending.length > 0 && online && (
        <div style={{ padding: "6px 16px" }}>
          <button onClick={sync} disabled={syncing}
            style={{
              width: "100%", padding: "8px", fontSize: 12, fontWeight: 700,
              background: "var(--yellow)", color: "#000", border: "none",
              borderRadius: "var(--radius-xs)", cursor: "pointer",
            }}>
            {syncing ? "Sincronizando..." : `Sincronizar ${pending.length} reportes pendientes`}
          </button>
        </div>
      )}
      {user.isAdmin && synced.length > 0 && (
        <div style={{ padding: "4px 16px" }}>
          <button onClick={clearSynced}
            style={{
              width: "100%", padding: "6px", fontSize: 11, fontWeight: 600,
              background: "transparent", color: "var(--red)", border: "1px solid rgba(255,59,59,0.3)",
              borderRadius: "var(--radius-xs)", cursor: "pointer",
            }}>
            Limpiar {synced.length} fallidos
          </button>
        </div>
      )}

      {/* Desktop navigation */}
      <nav className="pw-desktop-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
          <span className="pw-nav-icon">📰</span>
          <span className="pw-nav-label">Noticias</span>
        </NavLink>
        {user.role !== "guest" && (
          <NavLink to="/reportar" className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
            <span className="pw-nav-icon">🚨</span>
            <span className="pw-nav-label">Reportar</span>
          </NavLink>
        )}
        {user.isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
            <span className="pw-nav-icon">🛡️</span>
            <span className="pw-nav-label">Moderar</span>
          </NavLink>
        )}
      </nav>

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<NewsFeed synced={synced} pending={pending} />} />
          {user.role !== "guest" && <Route path="/reportar" element={<ReportPage onSave={enqueue} />} />}
          {user.isAdmin && <Route path="/admin" element={<AdminPanel />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="pw-mobile-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
          <span className="pw-nav-icon">📰</span>
          <span className="pw-nav-label">Noticias</span>
        </NavLink>
        {user.role !== "guest" && (
          <NavLink to="/reportar" className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
            <span className="pw-nav-icon">🚨</span>
            <span className="pw-nav-label">Reportar</span>
          </NavLink>
        )}
        {user.isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
            <span className="pw-nav-icon">🛡️</span>
            <span className="pw-nav-label">Moderar</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

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
      <div className="pw-side-mountain" />
      <header className="pw-header">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <h1>RutaSegura</h1>
          <span className={`pw-online-dot ${online ? "online" : "offline"}`} />
        </div>
        <p className="subtitle">Auditoría Vial Inmutable — RN 51</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, fontSize: 13, color: "var(--texto-secundario)", marginBottom: 4 }}>
          <span>{user.nombre} ({user.chofer_id})</span>
          <button onClick={logout} style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 12,
            color: "var(--bordo)", fontWeight: 600, padding: 0, textDecoration: "underline",
          }}>
            Salir
          </button>
        </div>
        {user.isAdmin && (
          <div className="pw-stats">
            <span>&#128337; {pending.length} pendientes</span>
            <span>&#9989; {synced.length} sincronizados</span>
          </div>
        )}
        {user.isAdmin && pending.length > 0 && online && (
          <button onClick={sync} disabled={syncing} className="pw-sync-btn">
            {syncing ? "Sincronizando..." : `Sincronizar ${pending.length} reportes`}
          </button>
        )}
        {user.isAdmin && synced.length > 0 && (
          <button onClick={clearSynced} className="pw-sync-btn" style={{ background: "var(--rechazado)" }}>
            Limpiar {synced.length} reportes fallidos
          </button>
        )}
      </header>

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

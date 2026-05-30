import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useOfflineSync } from "./hooks/useOfflineSync";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NewsFeed from "./pages/NewsFeed";
import ReportPage from "./pages/ReportPage";
import LoginPage from "./pages/LoginPage";
import AdminPanel from "./pages/AdminPanel";
import Mountains from "./components/Mountains";

function AppContent() {
  const { user, logout } = useAuth();
  const { pending, synced, online, syncing, enqueue, sync, clearSynced } = useOfflineSync();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="pw-wrapper">
      <Mountains />
      <div className="pw-content">
      <header className="pw-header">
        <div className="pw-header-left">
          <span className="pw-logo">RutaSegura</span>
          <span className="pw-rn51">RN 51</span>
        </div>
        <div className="pw-header-right">
          {user.isAdmin && (
            <div className="pw-header-stats">{pending.length} pend / {synced.length} sinc</div>
          )}
          <span className="pw-dot-online" />
          <span className="pw-online-label">{online ? "Online" : "Offline"}</span>
          <button className="pw-header-user" onClick={logout}>
            {user.nombre}
          </button>
        </div>
      </header>

      {user.isAdmin && pending.length > 0 && online && (
        <div className="pw-sync-bar">
          <button onClick={sync} disabled={syncing} className="pw-sync-btn">
            {syncing ? "Sincronizando..." : `Sincronizar ${pending.length} reportes`}
          </button>
        </div>
      )}
      {user.isAdmin && synced.length > 0 && (
        <div className="pw-sync-bar" style={{ borderBottom: "none", paddingTop: 0 }}>
          <button onClick={clearSynced} className="pw-clear-btn">
            Limpiar {synced.length} fallidos
          </button>
        </div>
      )}

      <main>
        <Routes>
          <Route path="/" element={<NewsFeed synced={synced} pending={pending} />} />
          {user.role !== "guest" && <Route path="/reportar" element={<ReportPage onSave={enqueue} />} />}
          {user.isAdmin && <Route path="/admin" element={<AdminPanel />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      </div>

      <nav className="pw-mobile-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
          Noticias
        </NavLink>
        {user.role !== "guest" && (
          <NavLink to="/reportar" className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
            Reportar
          </NavLink>
        )}
        {user.isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
            Moderar
          </NavLink>
        )}
      </nav>

      <nav className="pw-desktop-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
          Noticias
        </NavLink>
        {user.role !== "guest" && (
          <NavLink to="/reportar" className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
            Reportar
          </NavLink>
        )}
        {user.isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? "pw-nav-active" : ""}>
            Moderar
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

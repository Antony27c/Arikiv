import { NavLink } from "react-router-dom";

export default function DesktopNav({ user, logout, online, pending, synced }) {
  return (
    <aside className="pw-sidebar">
      <div className="pw-sidebar-top">
        <svg width="160" height="56" viewBox="0 0 220 80" role="img" className="pw-sidebar-logo-img">
          <g transform="translate(8, 8)">
            <rect x="0" y="0" width="48" height="48" rx="10" fill="#C9A84C"/>
            <polyline points="6,38 18,18 28,28 38,12 42,18" fill="none" stroke="#3B1010" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
            <circle cx="38" cy="12" r="3" fill="#3B1010"/>
            <line x1="0" y1="42" x2="48" y2="42" stroke="#3B1010" strokeWidth="1" opacity="0.3"/>
            <text x="60" y="28" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="500" fill="#F5F0E8">Vi</text>
            <text x="90" y="28" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="500" fill="#C9A84C">Arkiv</text>
          </g>
        </svg>
        <div className="pw-sidebar-status">
          <span className="pw-dot-online" />
          <span className="pw-sidebar-online">{online ? "Online" : "Offline"}</span>
        </div>
        <div className="pw-sidebar-divider" />
      </div>

      <nav className="pw-sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? "pw-sidebar-link pw-sidebar-active" : "pw-sidebar-link"}>
          Noticias
        </NavLink>
        {user.role !== "guest" && (
          <NavLink to="/reportar" className={({ isActive }) => isActive ? "pw-sidebar-link pw-sidebar-active" : "pw-sidebar-link"}>
            Reportar
          </NavLink>
        )}
        {user.isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? "pw-sidebar-link pw-sidebar-active" : "pw-sidebar-link"}>
            Moderar
          </NavLink>
        )}
      </nav>

      <div className="pw-sidebar-bottom">
        {user.isAdmin && (
          <div className="pw-sidebar-stats">
            {pending.length} pendientes · {synced.length} sinc
          </div>
        )}
        <div className="pw-sidebar-divider" />
        <div className="pw-sidebar-user">
          <span>{user.nombre}</span>
          <button className="pw-sidebar-logout" onClick={logout}>Salir</button>
        </div>
      </div>
    </aside>
  );
}

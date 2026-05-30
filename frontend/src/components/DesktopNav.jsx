import { NavLink } from "react-router-dom";

export default function DesktopNav({ user, logout, online, pending, synced }) {
  return (
    <aside className="pw-sidebar">
      <div className="pw-sidebar-top">
        <div className="pw-sidebar-logo">RutaSegura</div>
        <div className="pw-sidebar-rn51">RN 51</div>
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

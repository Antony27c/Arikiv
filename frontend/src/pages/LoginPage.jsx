import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { loginUser, loginAdmin, loginGuest } = useAuth();
  const [tab, setTab] = useState("user");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const ok = tab === "admin" ? loginAdmin(username, password) : loginUser(username, password);
    if (!ok) setError("Usuario o contraseña incorrectos");
  }

  return (
    <div className="pw-login-wrap">
      <h1 className="pw-login-title">RutaSegura</h1>
      <p className="pw-login-sub">Auditoria vial inmutable &mdash; RN 51</p>

      <div className="pw-tabs" style={{ margin: 0, marginBottom: 24 }}>
        <button type="button" onClick={() => { setTab("user"); setError(""); }}
          className={`pw-tab ${tab === "user" ? "pw-tab-active" : ""}`}>
          Usuario
        </button>
        <button type="button" onClick={() => { setTab("admin"); setError(""); }}
          className={`pw-tab ${tab === "admin" ? "pw-tab-active" : ""}`}>
          Admin
        </button>
      </div>

      {error && <div className="pw-toast pw-toast-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input className="pw-input" placeholder="Usuario" value={username}
          onChange={e => setUsername(e.target.value)} required style={{ marginBottom: 8 }} />
        <input className="pw-input" type="password" placeholder="Contrasena" value={password}
          onChange={e => setPassword(e.target.value)} required style={{ marginBottom: 20 }} />
        <button type="submit" className="pw-btn-primary">Ingresar</button>
      </form>

      <div className="pw-login-divider">o</div>

      <button onClick={loginGuest} className="pw-btn-secondary" style={{ display: "block", width: "100%", textAlign: "center" }}>
        Entrar como invitado
      </button>
    </div>
  );
}

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
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: 24 }}>
      <div className="pw-login-card" style={{ width: "100%" }}>
        <h2 className="pw-login-title">RutaSegura</h2>
        <p className="pw-login-sub">Auditoría Vial Inmutable — RN 51</p>

        <div className="pw-segmented" style={{ marginBottom: 20 }}>
          <button type="button" onClick={() => { setTab("user"); setError(""); }}
            className={`pw-seg-btn ${tab === "user" ? "pw-seg-active" : ""}`}>
            Usuario
          </button>
          <button type="button" onClick={() => { setTab("admin"); setError(""); }}
            className={`pw-seg-btn ${tab === "admin" ? "pw-seg-active" : ""}`}>
            Admin
          </button>
        </div>

        {error && (
          <div className="pw-toast pw-toast-error" style={{ position: "static", transform: "none" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input className="pw-input" placeholder="Usuario" value={username}
            onChange={e => setUsername(e.target.value)} required style={{ marginBottom: 10 }} />
          <input className="pw-input" type="password" placeholder="Contraseña" value={password}
            onChange={e => setPassword(e.target.value)} required style={{ marginBottom: 16 }} />
          <button type="submit" className="pw-btn-primary" style={{ width: "100%" }}>
            Ingresar
          </button>
        </form>

        <div style={{ margin: "16px 0", textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
          — o —
        </div>

        <button onClick={loginGuest} className="pw-btn-secondary" style={{ width: "100%" }}>
          Entrar como Invitado
        </button>
      </div>
    </div>
  );
}

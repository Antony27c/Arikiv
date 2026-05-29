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
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh", padding: 20 }}>
      <div className="pw-form pw-login-card">
        <h2 className="pw-login-title">RutaSegura</h2>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--texto-secundario)", marginBottom: 12 }}>
          Auditoría Vial Inmutable — RN 51
        </p>

        <div style={{ display: "flex", marginBottom: 16, borderRadius: 10, overflow: "hidden", border: "1px solid var(--borde)", padding: 3, background: "var(--fondo)" }}>
          <button type="button" onClick={() => { setTab("user"); setError(""); }}
            style={{
              flex: 1, padding: "10px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
              background: tab === "user" ? "var(--blanco)" : "transparent",
              color: tab === "user" ? "var(--bordo)" : "var(--texto-secundario)",
              borderRadius: 8, transition: "all 0.2s ease",
              boxShadow: tab === "user" ? "var(--sombra)" : "none",
            }}>
            Usuario
          </button>
          <button type="button" onClick={() => { setTab("admin"); setError(""); }}
            style={{
              flex: 1, padding: "10px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
              background: tab === "admin" ? "var(--blanco)" : "transparent",
              color: tab === "admin" ? "var(--bordo)" : "var(--texto-secundario)",
              borderRadius: 8, transition: "all 0.2s ease",
              boxShadow: tab === "admin" ? "var(--sombra)" : "none",
            }}>
            Admin
          </button>
        </div>

        {error && (
          <div style={{ background: "var(--critica)", color: "#fff", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input className="pw-input" placeholder="Usuario" value={username}
            onChange={e => setUsername(e.target.value)} required style={{ marginBottom: 8 }} />
          <input className="pw-input" type="password" placeholder="Contraseña" value={password}
            onChange={e => setPassword(e.target.value)} required style={{ marginBottom: 16 }} />
          <button type="submit" className="pw-btn-primary" style={{ width: "100%" }}>
            Ingresar
          </button>
        </form>

        <div style={{ margin: "16px 0", textAlign: "center", color: "var(--texto-secundario)", fontSize: 12 }}>
          — o —
        </div>

        <button onClick={loginGuest} className="pw-btn-secondary" style={{ width: "100%" }}>
          Entrar como Invitado
        </button>
      </div>
    </div>
  );
}

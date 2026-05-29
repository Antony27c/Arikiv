import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { loginAdmin, loginGuest } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const ok = loginAdmin(username, password);
    if (!ok) setError("Usuario o contraseña incorrectos");
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", padding: 20 }}>
      <div className="pw-form" style={{ maxWidth: 400, width: "100%" }}>
        <h2 style={{ textAlign: "center", marginBottom: 4 }}>RutaSegura</h2>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--texto-secundario)", marginBottom: 20 }}>
          Auditoría Vial Inmutable — RN 51
        </p>

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

        <div style={{ marginTop: 16, fontSize: 12, color: "var(--texto-secundario)", textAlign: "center" }}>
          <p style={{ marginBottom: 4 }}>Admin de prueba:</p>
          <code style={{ fontSize: 11 }}>admin / admin123</code>
        </div>
      </div>
    </div>
  );
}

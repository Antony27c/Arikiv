import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const BASE = import.meta.env.VITE_BACKEND_URL || "";

export default function LoginPage() {
  const { login } = useAuth();
  const [tab, setTab] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regChoferId, setRegChoferId] = useState("");
  const [regNombre, setRegNombre] = useState("");
  const [regEmpresa, setRegEmpresa] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al iniciar sesión");
      login(data.token, data.chofer_id, data.nombre, data.empresa);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chofer_id: regChoferId,
          nombre: regNombre,
          username: regUsername,
          password: regPassword,
          empresa: regEmpresa,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al registrarse");
      login(data.token, data.chofer_id, data.nombre, data.empresa);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", padding: 20 }}>
      <div className="pw-form" style={{ maxWidth: 400, width: "100%" }}>
        <h2 style={{ textAlign: "center", marginBottom: 16 }}>RutaSegura</h2>

        <div style={{ display: "flex", marginBottom: 16, borderRadius: 8, overflow: "hidden", border: "1px solid var(--borde)" }}>
          <button type="button" onClick={() => { setTab("login"); setError(""); }}
            style={{
              flex: 1, padding: "10px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
              background: tab === "login" ? "var(--bordo)" : "var(--fondo)",
              color: tab === "login" ? "#fff" : "var(--texto-secundario)",
            }}>
            Iniciar Sesión
          </button>
          <button type="button" onClick={() => { setTab("register"); setError(""); }}
            style={{
              flex: 1, padding: "10px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
              background: tab === "register" ? "var(--bordo)" : "var(--fondo)",
              color: tab === "register" ? "#fff" : "var(--texto-secundario)",
            }}>
            Registrarse
          </button>
        </div>

        {error && (
          <div style={{ background: "var(--critica)", color: "#fff", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
            {error}
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin}>
            <input className="pw-input" placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} required style={{ marginBottom: 8 }} />
            <input className="pw-input" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required style={{ marginBottom: 16 }} />
            <button type="submit" className="pw-btn-primary" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <input className="pw-input" placeholder="Código de chofer (ej: CHO-006)" value={regChoferId} onChange={e => setRegChoferId(e.target.value)} required style={{ marginBottom: 8 }} />
            <input className="pw-input" placeholder="Nombre completo" value={regNombre} onChange={e => setRegNombre(e.target.value)} required style={{ marginBottom: 8 }} />
            <input className="pw-input" placeholder="Nombre de usuario" value={regUsername} onChange={e => setRegUsername(e.target.value)} required style={{ marginBottom: 8 }} />
            <input className="pw-input" type="password" placeholder="Contraseña" value={regPassword} onChange={e => setRegPassword(e.target.value)} required style={{ marginBottom: 8 }} />
            <input className="pw-input" placeholder="Empresa minera" value={regEmpresa} onChange={e => setRegEmpresa(e.target.value)} style={{ marginBottom: 16 }} />
            <button type="submit" className="pw-btn-primary" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 16, fontSize: 12, color: "var(--texto-secundario)", textAlign: "center" }}>
          <p style={{ marginBottom: 4 }}>Usuarios de prueba:</p>
          <code style={{ fontSize: 11 }}>cgomez / pass123</code> &middot;
          <code style={{ fontSize: 11 }}> mlopez / pass123</code> &middot;
          <code style={{ fontSize: 11 }}> jperez / pass123</code>
        </div>
      </div>
    </div>
  );
}

import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const ADMINS = [
  { username: "admin", password: "admin123", nombre: "Administrador", empresa: "RutaSegura" },
];

const GUEST_USER = {
  token: "guest-token",
  chofer_id: "INV-001",
  nombre: "Invitado",
  empresa: "",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  function loginAdmin(username, password) {
    const admin = ADMINS.find(a => a.username === username && a.password === password);
    if (!admin) return false;
    setUser({
      token: "admin-token",
      chofer_id: "ADMIN",
      nombre: admin.nombre,
      empresa: admin.empresa,
      isAdmin: true,
    });
    return true;
  }

  function loginGuest() {
    setUser(GUEST_USER);
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loginAdmin, loginGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
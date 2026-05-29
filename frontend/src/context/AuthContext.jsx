import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const USERS = [
  { username: "cgomez", password: "pass123", chofer_id: "CHO-001", nombre: "Carlos Gómez", empresa: "Lithium Americas" },
  { username: "mlopez", password: "pass123", chofer_id: "CHO-002", nombre: "María López", empresa: "Sales de Jujuy" },
  { username: "jperez", password: "pass123", chofer_id: "CHO-003", nombre: "Juan Pérez", empresa: "Eramine" },
];

const ADMINS = [
  { username: "admin", password: "admin123", nombre: "Administrador", empresa: "RutaSegura" },
];

const GUEST_USER = {
  token: "guest-token",
  chofer_id: "INV-001",
  nombre: "Invitado",
  empresa: "",
  role: "guest",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("rutasegura_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("rutasegura_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("rutasegura_user");
    }
  }, [user]);

  function loginUser(username, password) {
    const found = USERS.find(u => u.username === username && u.password === password);
    if (!found) return false;
    setUser({
      token: "user-token",
      chofer_id: found.chofer_id,
      nombre: found.nombre,
      empresa: found.empresa,
      role: "user",
    });
    return true;
  }

  function loginAdmin(username, password) {
    const admin = ADMINS.find(a => a.username === username && a.password === password);
    if (!admin) return false;
    setUser({
      token: "admin-token",
      chofer_id: "ADMIN",
      nombre: admin.nombre,
      empresa: admin.empresa,
      role: "admin",
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
    <AuthContext.Provider value={{ user, loginUser, loginAdmin, loginGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const DEFAULT_USER = {
  token: "dev-token",
  chofer_id: "CHO-001",
  nombre: "Carlos Gómez",
  empresa: "Lithium Americas",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEFAULT_USER);

  function login(token, chofer_id, nombre, empresa) {
    setUser({ token, chofer_id, nombre, empresa });
  }

  function logout() {
    setUser(DEFAULT_USER);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
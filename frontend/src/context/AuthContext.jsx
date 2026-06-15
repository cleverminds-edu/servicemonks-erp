import { createContext, useContext, useState } from "react";
import { login as apiLogin } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  });

  const login = async (employee_id, password) => {
    const data = await apiLogin(employee_id, password);
    localStorage.setItem("token", data.access_token);
    const u = {
      id: data.user_id,
      employee_id: data.employee_id,
      name: data.name,
      role: data.role,
      email: data.email,
    };
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

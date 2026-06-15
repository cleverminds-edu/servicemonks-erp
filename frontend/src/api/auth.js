import client from "./client";

export const login = (employee_id, password) =>
  client.post("/auth/login", { employee_id, password }).then((r) => r.data);

export const getMe = () => client.get("/auth/me").then((r) => r.data);

import client from "./client";

export const login = (employee_id, password) =>
  client.post("/auth/login", { employee_id, password }).then((r) => r.data);

export const getMe = () => client.get("/auth/me").then((r) => r.data);

export const changePassword = (current_password, new_password) =>
  client.post("/auth/change-password", { current_password, new_password }).then((r) => r.data);

export const markAttendance = () =>
  client.post("/auth/mark-attendance").then((r) => r.data).catch(() => ({}));

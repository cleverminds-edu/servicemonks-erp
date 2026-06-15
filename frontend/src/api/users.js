import client from "./client";

export const getUsers = (role) =>
  client.get("/users", { params: role ? { role } : {} }).then((r) => r.data);

export const createUser = (data) =>
  client.post("/users", data).then((r) => r.data);

export const updateUser = (id, data) =>
  client.put(`/users/${id}`, data).then((r) => r.data);

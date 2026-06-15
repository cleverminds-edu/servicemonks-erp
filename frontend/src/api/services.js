import client from "./client";

export const getServiceTypes = () =>
  client.get("/services/types").then((r) => r.data);

export const getContracts = (customerId) =>
  client.get("/services/contracts", { params: customerId ? { customer_id: customerId } : undefined }).then((r) => r.data);

export const createContract = (data) =>
  client.post("/services/contracts", data).then((r) => r.data);

export const updateContract = (id, data) =>
  client.put(`/services/contracts/${id}`, data).then((r) => r.data);

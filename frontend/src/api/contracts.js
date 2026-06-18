import client from "./client";

export const getContract = (customerId) =>
  client.get(`/customers/${customerId}/contract`).then((r) => r.data).catch(() => null);

export const createOrUpdateContract = (customerId, data) =>
  client.post(`/customers/${customerId}/contract`, data).then((r) => r.data);

export const deleteContract = (customerId) =>
  client.delete(`/customers/${customerId}/contract`).then((r) => r.data);

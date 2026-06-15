import client from "./client";

export const getClaims = (params) =>
  client.get("/conveyance", { params }).then((r) => r.data);

export const submitClaim = (data) =>
  client.post("/conveyance", data).then((r) => r.data);

export const approveClaim = (id) =>
  client.put(`/conveyance/${id}/approve`).then((r) => r.data);

export const rejectClaim = (id) =>
  client.put(`/conveyance/${id}/reject`).then((r) => r.data);

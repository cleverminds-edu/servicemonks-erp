import client from "./client";

export const getJobs = (params) =>
  client.get("/jobs", { params }).then((r) => r.data);

export const getJob = (id) =>
  client.get(`/jobs/${id}`).then((r) => r.data);

export const createJob = (data) =>
  client.post("/jobs", data).then((r) => r.data);

export const updateJob = (id, data) =>
  client.put(`/jobs/${id}`, data).then((r) => r.data);

export const checkinJob = (id, lat, lng) =>
  client.post(`/jobs/${id}/checkin`, null, { params: { lat, lng } }).then((r) => r.data);

export const submitJob = (id, data) =>
  client.post(`/jobs/${id}/submit`, data).then((r) => r.data);

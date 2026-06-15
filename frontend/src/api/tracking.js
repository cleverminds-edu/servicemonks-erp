import client from "./client";

export const pushLocation = (data) =>
  client.post("/tracking/location", data).then((r) => r.data);

export const getLiveLocations = () =>
  client.get("/tracking/live").then((r) => r.data);

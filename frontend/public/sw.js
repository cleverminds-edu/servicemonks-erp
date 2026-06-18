// Self-destructing Service Worker
// This file exists only to unregister the old Service Worker
// that was persisting in the browser cache

console.log("Unregistering old Service Worker...");

if (typeof self !== "undefined" && self.registration) {
  self.registration.unregister().then(() => {
    console.log("Service Worker unregistered successfully");
  });
}

// Also try via clients API
self.clients.matchAll().then((clients) => {
  clients.forEach((client) => {
    client.postMessage({
      type: "UNREGISTER_SW",
      message: "Service Worker is being unregistered",
    });
  });
});

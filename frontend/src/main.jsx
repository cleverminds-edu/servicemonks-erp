import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Clear old Service Workers and caches that may be causing issues
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => {
      console.log("Unregistering Service Worker:", reg.scope);
      reg.unregister();
    });
  });

  // Clear all caches
  if ("caches" in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        console.log("Clearing cache:", cacheName);
        caches.delete(cacheName);
      });
    });
  }
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// PWA disabled temporarily to debug mixed content issues
// import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // VitePWA disabled
    // VitePWA({...}),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":  ["react", "react-dom", "react-router-dom"],
          "vendor-maps":   ["@react-google-maps/api"],
          "vendor-ui":     ["lucide-react", "date-fns"],
          "vendor-http":   ["axios"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true, ws: true },
      "/uploads": "http://localhost:8000",
    },
  },
});

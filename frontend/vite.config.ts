import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev-only proxy: the frontend calls fetch("/api/...") and Vite forwards it
// to the Express backend, so the browser never needs to know a different
// port/origin exists (and it matches how the app will be served in prod,
// behind a single reverse proxy).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});

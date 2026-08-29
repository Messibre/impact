import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// One-domain deployment:
// - Production/preview: the backend serves the built frontend (frontend/dist)
//   and the API from a single origin, so no proxy is involved.
// - Local development (`npm run dev`): Vite serves the UI with HMR and proxies
//   API + upload requests to the backend (defaults to http://localhost:4000).
const BACKEND_ORIGIN = process.env.VITE_BACKEND_ORIGIN || "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": BACKEND_ORIGIN,
      "/uploads": BACKEND_ORIGIN,
    },
  },
});

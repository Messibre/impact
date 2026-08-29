import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    strictPort: true,
    host: true,
    allowedHosts: true,
    proxy: {
      "/api": "http://localhost:4001",
      "/uploads": "http://localhost:4001",
    },
  },
});

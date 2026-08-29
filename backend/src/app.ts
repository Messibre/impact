import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

import authRoutes from "./routes/auth.routes";
import storyRoutes from "./routes/story.routes";
import consentRoutes from "./routes/consent.routes";
import adminRoutes from "./routes/admin.routes";
import { errorMiddleware } from "./middlewares/error.middleware";

export const app = express();

app.use(cors());
app.use(express.json());

// Serves locally-stored uploads/generated clips when STORAGE_MODE=local.
app.use("/uploads", express.static(path.resolve(process.env.STORAGE_LOCAL_DIR || "./uploads")));

const API_BASE = "/api/v1";
app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}`, storyRoutes);
app.use(`${API_BASE}`, consentRoutes);
app.use(`${API_BASE}/admin`, adminRoutes);

// Not-found fallback for anything under /api/v1 that didn't match above.
app.use(API_BASE, (_req, res) => {
  res.status(404).json({ statusCode: 404, success: false, message: "Not found", data: null });
});

// One-domain deployment: serve the built frontend (frontend/dist) from the same
// origin as the API. This block is skipped in development, where the Vite dev
// server owns the frontend and proxies /api + /uploads to this backend.
// Resolves correctly from both backend/src (ts-node dev) and backend/dist (built).
const FRONTEND_DIST_DIR = process.env.FRONTEND_DIST_DIR || path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(path.join(FRONTEND_DIST_DIR, "index.html"))) {
  app.use(express.static(FRONTEND_DIST_DIR));

  // SPA fallback: send index.html for any non-API, non-uploads GET route so
  // client-side routing (e.g. /story/:uid, /upload/:id/dashboard) works on refresh.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(FRONTEND_DIST_DIR, "index.html"));
  });
}

app.use(errorMiddleware);

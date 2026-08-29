import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

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

app.use(errorMiddleware);

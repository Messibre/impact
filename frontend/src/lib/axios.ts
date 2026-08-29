import axios from "axios";
import { getFounderToken } from "./founderToken";

// API base URL:
// - Separate-origin deploy (frontend on its own domain, backend on Render):
//   set VITE_API_BASE_URL to the backend API root, e.g.
//   "https://impact-backend-hviv.onrender.com/api/v1".
// - One-domain deploy / local dev: leave it unset and requests use the
//   relative "/api/v1" path (served or proxied by the backend).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const api = axios.create({ baseURL: API_BASE_URL });

// Resolves media paths returned by the backend. Absolute URLs (e.g. Cloudinary
// certificate images) pass through untouched; relative "/uploads/..." paths are
// prefixed with the backend origin derived from VITE_API_BASE_URL so they load
// from Render even when the frontend is on a different origin.
export function resolveMediaUrl(
  url: string | null | undefined
): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const base = import.meta.env.VITE_API_BASE_URL || "";
  const origin = base.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url}`;
}

// Attaches the scoped founder token for the certificateId embedded in the
// request URL, when one is stored.
api.interceptors.request.use((config) => {
  const match = config.url?.match(/certificates\/([^/]+)/);
  const certificateId = match?.[1];
  if (certificateId) {
    const token = getFounderToken(certificateId);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface ApiEnvelope<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

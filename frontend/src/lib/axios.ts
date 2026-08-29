import axios from "axios";
import { getFounderToken } from "./founderToken";

export const api = axios.create({ baseURL: "/api/v1" });

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

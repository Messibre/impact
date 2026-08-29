import { Response } from "express";

// Standard response envelope used on every endpoint, per spec section 2.
export function sendResponse<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T
) {
  return res.status(statusCode).json({
    statusCode,
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
  });
}

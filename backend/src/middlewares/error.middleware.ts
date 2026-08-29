import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError";
import { sendResponse } from "../utils/ApiResponse";

// Every thrown error in the app funnels through here (spec: "All errors
// thrown via a shared ApiError class, caught by error.middleware.ts").
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return sendResponse(res, err.statusCode, err.message, null);
  }

  if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
    return sendResponse(res, 413, "File too large", null);
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return sendResponse(res, 400, firstIssue?.message || "Validation error", null);
  }

  console.error("[unhandled error]", err);
  return sendResponse(res, 500, "Internal server error", null);
}

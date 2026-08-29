import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

// Single hardcoded/env-based admin credential — no admin user table
// for this hackathon scope, per spec section 4.
export function adminAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return next(new ApiError(401, "Not authorized"));
  }
  next();
}

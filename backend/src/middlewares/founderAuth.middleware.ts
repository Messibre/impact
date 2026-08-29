import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyFounderToken } from "../utils/jwt";

// Verifies the founder token is scoped to :certificateId in route params —
// a founder token for cert_042 cannot touch cert_099.
export function founderAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Not authorized for this certificate"));
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = verifyFounderToken(token);
    if (payload.certificateId !== req.params.certificateId) {
      return next(new ApiError(401, "Not authorized for this certificate"));
    }
    next();
  } catch {
    next(new ApiError(401, "Not authorized for this certificate"));
  }
}

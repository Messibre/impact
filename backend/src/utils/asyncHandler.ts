import { Request, Response, NextFunction, RequestHandler } from "express";

// Wraps async controller functions so thrown/rejected errors reach error.middleware.ts
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

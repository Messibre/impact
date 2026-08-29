import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/ApiResponse";
import { founderLoginSchema } from "../schemas/auth.schema";
import { authenticateFounder } from "../services/auth.service";

export const founderLogin = asyncHandler(async (req: Request, res: Response) => {
  const { certificateId, password } = founderLoginSchema.parse(req.body);
  const { token, expiresIn } = await authenticateFounder(certificateId, password);
  sendResponse(res, 200, "Login successful", { token, certificateId, expiresIn });
});

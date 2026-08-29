import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/ApiResponse";
import { consentUpdateSchema } from "../schemas/story.schema";
import { setPersonConsent } from "../services/story.service";

export const updateConsent = asyncHandler(async (req: Request, res: Response) => {
  const { certificateId } = req.params;
  const { people } = consentUpdateSchema.parse(req.body);

  const updated = await setPersonConsent(certificateId, people);
  sendResponse(res, 200, "Consent updated", { updated });
});

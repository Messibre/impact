import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { uploadStorySchema } from "../schemas/story.schema";
import { createStoryMedia, purgeStoryMedia, listCertificatePeople } from "../services/story.service";
import { assembleStoryView } from "../services/storyView.service";
import { saveFile } from "../services/storage.service";

interface MulterFiles {
  voice?: Express.Multer.File[];
  clip?: Express.Multer.File[];
}

export const uploadStory = asyncHandler(async (req: Request, res: Response) => {
  const { certificateId } = req.params;
  const files = req.files as MulterFiles;

  const voiceFile = files?.voice?.[0];
  const clipFile = files?.clip?.[0];

  if (!voiceFile || !clipFile) {
    throw new ApiError(400, "Voice and clip are both required");
  }

  // people arrives as a JSON string in multipart form data.
  let peopleRaw: unknown = [];
  if (typeof req.body.people === "string") {
    try {
      peopleRaw = JSON.parse(req.body.people);
    } catch {
      throw new ApiError(400, "people must be valid JSON");
    }
  }

  const parsed = uploadStorySchema.parse({
    milestoneText: req.body.milestoneText,
    people: peopleRaw,
  });

  const [voice, clip] = await Promise.all([
    saveFile(voiceFile.buffer, voiceFile.originalname),
    saveFile(clipFile.buffer, clipFile.originalname),
  ]);

  const storyMedia = await createStoryMedia(
    certificateId,
    voice.url,
    clip.url,
    parsed.milestoneText,
    parsed.people
  );

  sendResponse(res, 201, "Story content saved, generation queued", {
    storyMediaId: storyMedia.id,
    certificateId,
    status: "generating",
  });
});

export const getPublicStory = asyncHandler(async (req: Request, res: Response) => {
  const { certificateId } = req.params;
  const view = await assembleStoryView(certificateId);

  if (!view) {
    throw new ApiError(404, "Certificate not found");
  }

  sendResponse(res, 200, "Story retrieved", view);
});

// Founder-scoped roster. Unlike getPublicStory, this returns every Person
// regardless of consentPublic, so the dashboard can toggle private people
// back to public. Guarded by founderAuthMiddleware (scoped to :certificateId).
export const getCertificatePeople = asyncHandler(async (req: Request, res: Response) => {
  const { certificateId } = req.params;
  const people = await listCertificatePeople(certificateId);

  sendResponse(res, 200, "People retrieved", { people });
});

export const deleteStory = asyncHandler(async (req: Request, res: Response) => {
  const { certificateId } = req.params;
  await purgeStoryMedia(certificateId);

  sendResponse(res, 200, "Story content deleted, certificate unaffected", {
    certificateId,
    onChainRecordUntouched: true,
  });
});

import { Router } from "express";
import multer from "multer";
import { uploadStory, getPublicStory, deleteStory } from "../controllers/story.controller";
import { founderAuthMiddleware } from "../middlewares/founderAuth.middleware";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

router.post(
  "/certificates/:certificateId/story",
  founderAuthMiddleware,
  upload.fields([
    { name: "voice", maxCount: 1 },
    { name: "clip", maxCount: 1 },
  ]),
  uploadStory
);

router.get("/story/:certificateId", getPublicStory);

router.delete("/certificates/:certificateId/story", founderAuthMiddleware, deleteStory);

export default router;

import { Router } from "express";
import multer from "multer";
import { issueCertificate } from "../controllers/admin.controller";
import { adminAuthMiddleware } from "../middlewares/adminAuth.middleware";

const router = Router();

// Optional certificate image comes as a single multipart file field named
// "image". When no file is sent (JSON body), multer.single is a no-op and
// express.json still parses the body as before.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

router.post(
  "/certificates",
  adminAuthMiddleware,
  upload.single("image"),
  issueCertificate
);

export default router;

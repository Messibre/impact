import { Router } from "express";
import { issueCertificate } from "../controllers/admin.controller";
import { adminAuthMiddleware } from "../middlewares/adminAuth.middleware";

const router = Router();
router.post("/certificates", adminAuthMiddleware, issueCertificate);

export default router;

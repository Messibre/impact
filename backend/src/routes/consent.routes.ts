import { Router } from "express";
import { updateConsent } from "../controllers/consent.controller";
import { founderAuthMiddleware } from "../middlewares/founderAuth.middleware";

const router = Router();
router.patch("/certificates/:certificateId/consent", founderAuthMiddleware, updateConsent);

export default router;

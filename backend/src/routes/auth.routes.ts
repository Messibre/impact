import { Router } from "express";
import { founderLogin } from "../controllers/auth.controller";

const router = Router();
router.post("/founder-login", founderLogin);

export default router;

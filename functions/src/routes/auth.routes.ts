import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.patch("/reset-password", AuthController.resetPassword);

export default router;

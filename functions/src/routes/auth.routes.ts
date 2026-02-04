import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post("/register", AuthController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 */
router.post("/login", AuthController.login);

/**
 * @openapi
 * /auth/reset-password:
 *   patch:
 *     summary: Reset user password
 *     tags: [Auth]
 */
router.patch("/reset-password", AuthController.resetPassword);

export default router;

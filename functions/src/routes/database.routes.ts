import { Router } from "express";
import { initDbHandler } from "../initDb";

const router = Router();

router.post("/init", initDbHandler);
router.post("/initDb", initDbHandler);

export default router;


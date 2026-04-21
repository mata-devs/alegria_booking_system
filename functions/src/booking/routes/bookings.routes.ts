import { Router } from "express";
import * as BookingController from "../controllers/booking.controller";

const router = Router();

router.post("/", BookingController.create);

export default router;

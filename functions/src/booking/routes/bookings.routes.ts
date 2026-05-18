import { Router } from "express";
import * as BookingController from "../controllers/booking.controller";

const router = Router();

router.post("/", BookingController.create);
router.post("/:bookingId/confirm", BookingController.confirm);

export default router;

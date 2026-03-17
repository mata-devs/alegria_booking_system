import { Router } from "express";
import * as BookingController from "../controllers/booking.controller";

const router = Router();

router.get("/", BookingController.list);
router.get("/operator/pending", BookingController.getPendingBookings);
router.get("/slots/availability", BookingController.slotsAvailability);
router.post("/", BookingController.create);
router.post("/scan-qr", BookingController.scanQRCode);
router.get("/:bookingId", BookingController.getBookingDetails);
router.post("/:bookingId/cancel", BookingController.cancel);
router.post("/:bookingId/reschedule", BookingController.reschedule);
router.get("/:bookingId/qrcode", BookingController.getQRCode);
router.patch("/:bookingId/confirm-payment", BookingController.confirmPayment);
router.post("/:bookingId/reject-payment", BookingController.rejectPayment);

export default router;

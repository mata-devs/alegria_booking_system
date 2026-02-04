import { Router } from "express";
import * as BookingController from "../controllers/booking.controller";

const router = Router();

/**
 * @openapi
 * /bookings:
 *   get:
 *     summary: Fetch all bookings
 *     tags: [Bookings]
 */
router.get("/", BookingController.list);

/**
 * @openapi
 * /bookings/slots/availability:
 *   get:
 *     summary: Check available slots
 *     tags: [Bookings]
 */
router.get("/slots/availability", BookingController.slotsAvailability);

/**
 * @openapi
 * /bookings/create:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 */
router.post("/create", BookingController.create);

/**
 * @openapi
 * /bookings/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 */
router.post("/cancel", BookingController.cancel);

/**
 * @openapi
 * /bookings/reschedule:
 *   post:
 *     summary: Reschedule a booking
 *     tags: [Bookings]
 */
router.post("/reschedule", BookingController.reschedule);

/**
 * @openapi
 * /bookings/scan-qrcode:
 *   get:
 *     summary: Scan QR code for booking verification
 *     tags: [Bookings]
 */
router.get("/scan-qrcode", BookingController.scanQRCode);

export default router;

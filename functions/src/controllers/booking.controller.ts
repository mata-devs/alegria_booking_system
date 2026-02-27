import { Request, Response } from "express";
import * as BookingService from "../services/booking.service";
import * as admin from "firebase-admin";

export async function list(req: Request, res: Response) {
  try {
    const data = await BookingService.getAllBookings();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function slotsAvailability(req: Request, res: Response) {
  try {
    const { activityId, date, guests } = req.query;
    const slots = await BookingService.getAvailableSlots(
        activityId as string,
        date as string,
        guests ? parseInt(guests as string) : undefined
    );
    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const {
      representative,
      guests,
      activityId,
      timeSlotId,
      tourDate,
      promoCode,
      paymentMethod,
    } = req.body;
    const idempotencyKey = req.headers["x-idempotency-key"] as string;

    // Validate required fields
    if (!representative || !guests || !activityId || !timeSlotId || !tourDate) {
      res.status(400).json({
        error: "Missing required fields: representative, guests, activityId, timeSlotId, tourDate",
      });
      return;
    }

    // Validate representative
    if (
        !representative.firstName ||
        !representative.lastName ||
        !representative.email ||
        !representative.phoneNumber ||
        representative.age === undefined ||
        !representative.nationality
    ) {
      res.status(400).json({ error: "Invalid representative info" });
      return;
    }

    // Convert tourDate string to Timestamp if needed
    let tourDateTs = tourDate;
    if (typeof tourDate === "string") {
      tourDateTs = admin.firestore.Timestamp.fromDate(new Date(tourDate));
    }

    const result = await BookingService.createBooking({
      representative,
      guests,
      activityId,
      timeSlotId,
      tourDate: tourDateTs,
      promoCode,
      paymentMethod,
      idempotencyKey,
    });

    res.status(201).json({ message: "Booking created", ...result });
  } catch (error: any) {
    const statusCode = error?.message?.includes("Insufficient") ? 400 : 500;
    res.status(statusCode).json({ error: error?.message || "Failed to create booking" });
  }
}

export async function getBookingDetails(req: Request, res: Response) {
  try {
    const bookingId = Array.isArray(req.params.bookingId)
        ? req.params.bookingId[0]
        : req.params.bookingId;

    if (!bookingId) {
      res.status(400).json({ error: "bookingId is required" });
      return;
    }

    const booking = await BookingService.getBooking(bookingId);
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    res.status(200).json(booking);
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function cancel(req: Request, res: Response) {
  try {
    const bookingId = Array.isArray(req.params.bookingId)
        ? req.params.bookingId[0]
        : req.params.bookingId;
    const { representativeEmail } = req.body;

    if (!bookingId) {
      res.status(400).json({ error: "bookingId is required" });
      return;
    }

    await BookingService.cancelBooking(bookingId as string, representativeEmail);
    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error: any) {
    const statusCode = error?.message?.includes("Unauthorized") ? 403 : 400;
    res.status(statusCode).json({ error: error?.message || "Failed to cancel booking" });
  }
}

export async function reschedule(req: Request, res: Response) {
  try {
    const bookingId = Array.isArray(req.params.bookingId)
        ? req.params.bookingId[0]
        : req.params.bookingId;
    const { newTimeSlotId, newTourDate, representativeEmail } = req.body;

    if (!bookingId || !newTimeSlotId || !newTourDate) {
      res.status(400).json({
        error: "Missing required fields: newTimeSlotId, newTourDate",
      });
      return;
    }

    // Convert newTourDate if needed
    let newTourDateTs = newTourDate;
    if (typeof newTourDate === "string") {
      newTourDateTs = admin.firestore.Timestamp.fromDate(new Date(newTourDate));
    }

    await BookingService.rescheduleBooking(
        bookingId as string,
        newTimeSlotId,
        newTourDateTs,
        representativeEmail
    );

    res.status(200).json({ message: "Booking rescheduled successfully" });
  } catch (error: any) {
    const statusCode = error?.message?.includes("Unauthorized") ? 403 : 400;
    res.status(statusCode).json({ error: error?.message || "Failed to reschedule booking" });
  }
}

export async function getQRCode(req: Request, res: Response) {
  try {
    const bookingId = Array.isArray(req.params.bookingId)
        ? req.params.bookingId[0]
        : req.params.bookingId;

    if (!bookingId) {
      res.status(400).json({ error: "bookingId is required" });
      return;
    }

    const booking = await BookingService.getBooking(bookingId);
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    const bookingData = booking as any;
    if (bookingData.status !== "paid") {
      res.status(400).json({ error: "QR code only available for paid bookings" });
      return;
    }

    // TODO: Generate QR code with Firebase Storage URL
    // For now, return placeholder
    const qrCodeDataString = `${bookingData.bookingId}|${bookingData.numberOfGuests}|${bookingData.status}|${bookingData.tourDate}`;

    res.status(200).json({
      qrCodeDataString,
      qrCodeUrl: null, // TODO: Generate actual QR code image
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to retrieve QR code" });
  }
}

export async function getPendingBookings(req: Request, res: Response) {
  try {
    const operatorUid = (req as any).operatorUid; // From auth middleware

    if (!operatorUid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const bookings = await BookingService.getPendingBookings(operatorUid);
    res.status(200).json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function confirmPayment(req: Request, res: Response) {
  try {
    const bookingId = Array.isArray(req.params.bookingId)
        ? req.params.bookingId[0]
        : req.params.bookingId;
    const operatorUid = (req as any).operatorUid; // From auth middleware
    const idempotencyKey = req.headers["x-idempotency-key"] as string;

    if (!bookingId) {
      res.status(400).json({ error: "bookingId is required" });
      return;
    }

    if (!operatorUid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await BookingService.confirmPayment(bookingId as string, operatorUid, idempotencyKey);
    res.status(200).json({ message: "Payment confirmed successfully" });
  } catch (error: any) {
    const statusCode = error?.message?.includes("Unauthorized") ? 403 : 400;
    res.status(statusCode).json({ error: error?.message || "Failed to confirm payment" });
  }
}

export async function rejectPayment(req: Request, res: Response) {
  try {
    const bookingId = Array.isArray(req.params.bookingId)
        ? req.params.bookingId[0]
        : req.params.bookingId;
    const { rejectionReason, rejectionNote } = req.body;
    const operatorUid = (req as any).operatorUid; // From auth middleware

    if (!bookingId || !rejectionReason) {
      res.status(400).json({
        error: "Missing required fields: rejectionReason",
      });
      return;
    }

    if (!operatorUid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await BookingService.rejectPayment(
        bookingId as string,
        rejectionReason,
        rejectionNote,
        operatorUid
    );
    res.status(200).json({ message: "Payment rejected successfully" });
  } catch (error: any) {
    const statusCode = error?.message?.includes("Unauthorized") ? 403 : 400;
    res.status(statusCode).json({ error: error?.message || "Failed to reject payment" });
  }
}

export async function scanQRCode(req: Request, res: Response) {
  try {
    const { bookingId } = req.body;
    const operatorUid = (req as any).operatorUid; // From auth middleware
    const idempotencyKey = req.headers["x-idempotency-key"] as string;

    if (!bookingId) {
      res.status(400).json({ error: "bookingId is required" });
      return;
    }

    if (!operatorUid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await BookingService.scanQRCode(bookingId, operatorUid, idempotencyKey);
    res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error?.message?.includes("Unauthorized") ? 403 : 404;
    res.status(statusCode).json({ error: error?.message || "Failed to scan QR code" });
  }
}

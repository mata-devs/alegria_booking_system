import type { Request, Response } from "express";
import * as BookingService from "../services/booking.service";

export async function create(req: Request, res: Response) {
  try {
    const idempotencyKey = req.headers["x-idempotency-key"];
    const payload = {
      ...req.body,
      idempotencyKey:
        typeof idempotencyKey === "string"
          ? idempotencyKey
          : Array.isArray(idempotencyKey)
            ? idempotencyKey[0]
            : undefined,
    } as BookingService.CreateBookingInput;

    if (!payload.receiptDataUrl || typeof payload.receiptDataUrl !== "string") {
      res.status(400).json({ error: "receiptDataUrl is required" });
      return;
    }
    if (!payload.paymentMethod || typeof payload.paymentMethod !== "string") {
      res.status(400).json({ error: "paymentMethod is required" });
      return;
    }

    const result = await BookingService.createBooking(payload);
    res.status(201).json({
      message: "Booking created",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create booking";
    const clientErrors = [
      "Missing required fields",
      "Invalid representative info",
      "guests must be an array",
      "Booking must be within",
      "Activity not found",
      "Activity is not active",
      "Maximum",
      "Invalid or expired promo code",
      "No active operators available",
      "Insufficient slots available",
      "Invalid tourDate format",
      "Phone number must start with",
      "Representative age must be at least",
      "All guest ages must be at least",
      "specialRequests must be",
      "paymentMethod is required",
      "receiptDataUrl is required",
      "Invalid receiptDataUrl format",
      "Receipt file is empty",
      "Receipt image must be 5MB or smaller",
    ];
    const status = clientErrors.some((prefix) => message.includes(prefix)) ? 400 : 500;
    res.status(status).json({ error: message });
  }
}

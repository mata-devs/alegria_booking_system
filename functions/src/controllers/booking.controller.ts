import { Request, Response } from "express";
import * as BookingService from "../services/booking.service";

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
    const { activityID, date } = req.query as { activityID?: string; date?: string };
    const slots = await BookingService.getAvailableSlots(activityID, date);
    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { slotID, numberOfPax, customerID } = req.body || {};
    if (!slotID || !numberOfPax || !customerID) {
      res.status(400).json({ error: "Missing required fields: slotID, numberOfPax, customerID" });
      return;
    }
    const result = await BookingService.createBooking(req.body);
    res.status(201).json({ message: "Booking created", ...result });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to create booking" });
  }
}

export async function cancel(req: Request, res: Response) {
  try {
    const { bookingID } = req.body || {};
    if (!bookingID) {
      res.status(400).json({ error: "bookingID is required" });
      return;
    }
    await BookingService.cancelBooking(bookingID);
    res.status(200).json({ message: "Booking cancelled" });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to cancel booking" });
  }
}

export async function reschedule(req: Request, res: Response) {
  try {
    const { bookingID, newSlotID } = req.body || {};
    if (!bookingID || !newSlotID) {
      res.status(400).json({ error: "bookingID and newSlotID are required" });
      return;
    }
    await BookingService.rescheduleBooking(bookingID, newSlotID);
    res.status(200).json({ message: "Booking rescheduled" });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to reschedule booking" });
  }
}

export async function scanQRCode(req: Request, res: Response) {
  try {
    const { bookingID } = req.query as { bookingID?: string };
    if (!bookingID) {
      res.status(400).json({ error: "bookingID is required" });
      return;
    }
    const result = await BookingService.scanBooking(bookingID);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(404).json({ error: error?.message || "Booking not found" });
  }
}

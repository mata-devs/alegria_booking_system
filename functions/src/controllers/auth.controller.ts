import { Request, Response } from "express";
import * as UserService from "../services/user.service";

export async function register(req: Request, res: Response) {
  try {
    const { email, password, firstName, lastName, role = "customer", ...rest } = req.body || {};
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: "Missing required fields: email, password, firstName, lastName" });
      return;
    }
    const result = await UserService.registerUser({ email, password, firstName, lastName, role, ...rest });
    res.status(201).json({ message: "User registered successfully", uid: result.uid });
  } catch (error: any) {
    const statusCode = error?.code === "auth/email-already-exists" ? 400 : 500;
    res.status(statusCode).json({ error: error?.message || "Internal Server Error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const result = await UserService.loginUser(email, password);
    res.status(200).json({ message: "Login successful", ...result });
  } catch (error: any) {
    const message = error?.message === "Invalid email or password" ? error.message : "Internal Server Error";
    const status = error?.message === "Invalid email or password" ? 401 : 500;
    res.status(status).json({ error: message });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { email, newPassword } = req.body || {};
    if (!email || !newPassword) {
      res.status(400).json({ error: "Email and newPassword are required" });
      return;
    }
    await UserService.resetPassword(email, newPassword);
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error: any) {
    if (error?.code === "auth/user-not-found") {
      res.status(404).json({ error: "User not found" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

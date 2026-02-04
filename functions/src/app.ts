import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

import authRoutes from "./routes/auth.routes";
import bookingRoutes from "./routes/bookings.routes";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authRoutes);
app.use("/bookings", bookingRoutes);

/**
 * @openapi
 * /hello:
 *   get:
 *     description: Simple health check
 *     responses:
 *       200:
 *         description: Returns a greeting
 * @route GET /hello
 */
app.get("/hello", (req, res) => {
  res.status(200).send("Hello from Firebase Functions!");
});

export default app;

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

import authRoutes from "./routes/auth.routes";
import bookingRoutes from "./routes/bookings.routes";
import databaseRoutes from "./routes/database.routes";

const ALLOWED_ORIGINS = [
  //"https://alegriabooking.com",
  //"https://www.alegriabooking.com",
  // Local development
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4200",
];

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authRoutes);
app.use("/bookings", bookingRoutes);

// Middleware to alias /initDb to /database/init
app.post("/initDb", (req, res, next) => {
  req.url = "/database/initDb";
  next();
});

app.use("/database", databaseRoutes);

app.get("/hello", (req, res) => {
  res.status(200).send("Hello from Alegria Booking System!");
});

export default app;

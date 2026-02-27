/**
 * swagger-entry.js
 *
 * Used ONLY by swagger-autogen for documentation generation.
 * NOT compiled, NOT deployed, NOT used at runtime.
 *
 * Uses plain CommonJS require() pointing at TypeScript SOURCE files
 * (with explicit .ts extension so swagger-autogen finds them directly).
 * This avoids the __importDefault wrapper produced by the TypeScript compiler,
 * which swagger-autogen's regex cannot trace through.
 */
const express = require("express");
const app = express();

const authRouter = require("./src/routes/auth.routes.ts");
const bookingsRouter = require("./src/routes/bookings.routes.ts");
const databaseRouter = require("./src/routes/database.routes.ts");

app.use("/auth", authRouter);
app.use("/bookings", bookingsRouter);
app.use("/database", databaseRouter);

// Direct routes defined on app (not under a sub-router prefix)
app.post("/initDb", (req, res) => {});
app.get("/hello", (req, res) => {});

module.exports = app;


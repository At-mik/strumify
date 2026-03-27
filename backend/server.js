import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

// ENV
const PORT = process.env.PORT || 10000;
const { MONGO_URI, JWT_SECRET } = process.env;

// HARD FAIL if missing critical env
if (!MONGO_URI) throw new Error("Missing MONGO_URI");
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");

// CORS (fixed)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Middleware
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "strumify-api" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lessons", lessonRoutes);

// Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

// 🚀 START SERVER FIRST (CRITICAL FOR RENDER)
app.listen(PORT, () => {
  console.log(`Strumify backend running on port ${PORT}`);
});

// 🔌 CONNECT DB SEPARATELY (DO NOT BLOCK SERVER)
mongoose
  .connect(MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000
  })
  .then(() => {
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });

// Graceful shutdown (optional but fine)
process.on("SIGINT", async () => {
  console.log("SIGINT received. Shutting down...");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down...");
  await mongoose.connection.close();
  process.exit(0);
});
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
const { MONGO_URI, JWT_SECRET, PORT = 5001, CLIENT_ORIGIN } = process.env;

if (!MONGO_URI) throw new Error("Missing required environment variable: MONGO_URI");
if (!JWT_SECRET) throw new Error("Missing required environment variable: JWT_SECRET");

app.use(
  cors({
    origin: CLIENT_ORIGIN ? CLIENT_ORIGIN.split(",").map((origin) => origin.trim()) : true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "strumify-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lessons", lessonRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

const startServer = async () => {
  await mongoose.connect(MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000
  });

  console.log(`MongoDB connected: ${mongoose.connection.name}`);

  const server = app.listen(PORT, () => {
    console.log(`Strumify backend running on port ${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});

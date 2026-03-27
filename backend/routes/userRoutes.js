import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { buildProfilePayload } from "../middleware/gamification.js";
import Lesson from "../models/Lesson.js";

const router = express.Router();

router.get("/profile", authMiddleware, async (req, res, next) => {
  try {
    const totalLessons = await Lesson.countDocuments();

    return res.json(buildProfilePayload(req.user, totalLessons));
  } catch (error) {
    return next(error);
  }
});

export default router;

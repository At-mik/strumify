import express from "express";
import mongoose from "mongoose";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { buildProfilePayload, completeLessonForUser } from "../middleware/gamification.js";
import Lesson from "../models/Lesson.js";

const router = express.Router();

router.post("/complete", authMiddleware, async (req, res, next) => {
  try {
    const { lessonId, practiceMinutes } = req.body;

    if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "Valid lessonId is required" });
    }

    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const result = await completeLessonForUser(req.user, lesson, practiceMinutes);
    const totalLessons = await Lesson.countDocuments();

    return res.json({
      message: result.alreadyCompleted ? "Lesson already completed" : "Lesson completed",
      reward: {
        lessonTitle: lesson.title,
        xpEarned: result.xpEarned,
        streakBonusXp: result.streakBonusXp
      },
      levelUp: result.levelUp,
      alreadyCompleted: result.alreadyCompleted,
      profile: buildProfilePayload(req.user, totalLessons)
    });
  } catch (error) {
    return next(error);
  }
});

export default router;

import express from "express";
import mongoose from "mongoose";

import { authMiddleware } from "../middleware/authMiddleware.js";
import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";

const router = express.Router();

const buildUnlockedLessons = (courseLessons, completedSet) => {
  const unlockedSet = new Set();

  courseLessons.forEach((lesson, index) => {
    const currentId = String(lesson._id);

    if (index === 0) {
      unlockedSet.add(currentId);
      return;
    }

    const previousId = String(courseLessons[index - 1]._id);
    if (completedSet.has(previousId)) {
      unlockedSet.add(currentId);
    }
  });

  for (const completedId of completedSet) {
    unlockedSet.add(completedId);
  }

  return unlockedSet;
};

router.get("/:id/lessons", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid module id" });
    }

    const moduleDoc = await Module.findById(id).lean();
    if (!moduleDoc) {
      return res.status(404).json({ message: "Module not found" });
    }

    const [moduleLessons, courseLessons] = await Promise.all([
      Lesson.find({ moduleId: id }).sort({ order: 1 }).lean(),
      Lesson.find({ courseId: moduleDoc.courseId }).sort({ order: 1 }).select("_id").lean()
    ]);

    const completedSet = new Set(req.user.completedLessons.map((lessonId) => String(lessonId)));
    const unlockedSet = buildUnlockedLessons(courseLessons, completedSet);

    return res.json({
      module: moduleDoc,
      lessons: moduleLessons.map((lesson) => ({
        ...lesson,
        isCompleted: completedSet.has(String(lesson._id)),
        isUnlocked: unlockedSet.has(String(lesson._id))
      }))
    });
  } catch (error) {
    return next(error);
  }
});

export default router;

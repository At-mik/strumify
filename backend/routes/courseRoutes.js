import express from "express";
import mongoose from "mongoose";

import { authMiddleware } from "../middleware/authMiddleware.js";
import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ createdAt: 1 }).lean();

    const lessonsByCourse = await Lesson.aggregate([
      { $group: { _id: "$courseId", count: { $sum: 1 } } }
    ]);

    const modulesByCourse = await Module.aggregate([
      { $group: { _id: "$courseId", count: { $sum: 1 } } }
    ]);

    const lessonMap = new Map(lessonsByCourse.map((entry) => [String(entry._id), entry.count]));
    const moduleMap = new Map(modulesByCourse.map((entry) => [String(entry._id), entry.count]));

    return res.json(
      courses.map((course) => ({
        ...course,
        moduleCount: moduleMap.get(String(course._id)) || 0,
        lessonCount: lessonMap.get(String(course._id)) || 0
      }))
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/modules", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(id).lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const [modules, lessons] = await Promise.all([
      Module.find({ courseId: id }).sort({ order: 1 }).lean(),
      Lesson.find({ courseId: id }).select("moduleId").lean()
    ]);

    const lessonCountByModule = lessons.reduce((acc, lesson) => {
      const key = String(lesson.moduleId);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      course,
      modules: modules.map((moduleDoc) => ({
        ...moduleDoc,
        lessonCount: lessonCountByModule[String(moduleDoc._id)] || 0
      }))
    });
  } catch (error) {
    return next(error);
  }
});

export default router;

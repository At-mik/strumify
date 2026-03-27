import dotenv from "dotenv";
import mongoose from "mongoose";

import Course from "./models/Course.js";
import Lesson from "./models/Lesson.js";
import Module from "./models/Module.js";

dotenv.config();

const courseSeed = {
  title: "Strumify Beginner Foundation",
  level: "Beginner",
  description:
    "A Duolingo-style guitar learning journey that combines structured lessons, practice tools, and daily progress motivation.",
  modules: [
    {
      title: "Guitar Basics",
      order: 1,
      lessons: [
        "What is a Guitar",
        "Types of Guitars",
        "Parts of Guitar",
        "String Names"
      ]
    },
    {
      title: "Chords",
      order: 2,
      lessons: [
        "What is a Chord",
        "Open Chords",
        "Chord Families",
        "Chord Progressions"
      ]
    },
    {
      title: "Strumming",
      order: 3,
      lessons: [
        "What is Strumming",
        "Downstroke / Upstroke",
        "Basic Strum Pattern",
        "Rhythm Practice"
      ]
    },
    {
      title: "Music Theory",
      order: 4,
      lessons: [
        "Rhythm",
        "Time Signature",
        "Note Values",
        "Syncopation"
      ]
    },
    {
      title: "Power Chords",
      order: 5,
      lessons: ["Power Chords", "Shapes", "Movable Chords"]
    },
    {
      title: "Technique",
      order: 6,
      lessons: ["Hammer On", "Pull Off", "Slides", "Fingerstyle"]
    },
    {
      title: "Advanced Basics",
      order: 7,
      lessons: ["Barre Chords", "Transposing", "Song Structure"]
    },
    {
      title: "Musical Thinking",
      order: 8,
      lessons: ["Call and Response", "Improvisation", "Phrase Building"]
    },
    {
      title: "Final Stage",
      order: 9,
      lessons: ["Performance Preparation", "Final Showcase"]
    }
  ]
};

const genericLessonContent = (title, moduleTitle) => ({
  content:
    `${title} in ${moduleTitle}. Study the concept, observe hand movement, and apply it with clean timing and controlled posture.`,
  chordDiagrams: [
    "e|---0---|", 
    "B|---1---|", 
    "G|---0---|", 
    "D|---2---|", 
    "A|---3---|", 
    "E|---x---|"
  ],
  practiceInstructions: [
    "Play slowly with a metronome at 60 BPM for 2 minutes.",
    "Focus on clean sound and even rhythm.",
    "Increase speed only after 3 clean repetitions.",
    "Record one take and review timing accuracy."
  ]
});

const runSeed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing required environment variable: MONGO_URI");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000
  });

  await Promise.all([Lesson.deleteMany({}), Module.deleteMany({}), Course.deleteMany({})]);

  const course = await Course.create({
    title: courseSeed.title,
    level: courseSeed.level,
    description: courseSeed.description
  });

  let lessonOrder = 1;

  for (const moduleSeed of courseSeed.modules) {
    const moduleDoc = await Module.create({
      title: moduleSeed.title,
      order: moduleSeed.order,
      courseId: course._id
    });

    const lessons = moduleSeed.lessons.map((lessonTitle) => {
      const content = genericLessonContent(lessonTitle, moduleSeed.title);
      return {
        title: lessonTitle,
        order: lessonOrder++,
        duration: 12,
        xpReward: 50,
        content: content.content,
        chordDiagrams: content.chordDiagrams,
        practiceInstructions: content.practiceInstructions,
        courseId: course._id,
        moduleId: moduleDoc._id
      };
    });

    await Lesson.insertMany(lessons);
  }

  const moduleCount = await Module.countDocuments({ courseId: course._id });
  const lessonCount = await Lesson.countDocuments({ courseId: course._id });

  if (moduleCount !== 9 || lessonCount !== 31) {
    throw new Error(`Seed validation failed. Expected 9 modules and 31 lessons, got ${moduleCount} modules and ${lessonCount} lessons.`);
  }

  console.log("Seed completed successfully");
  console.log(`- Course: ${course.title}`);
  console.log(`- Modules: ${moduleCount}`);
  console.log(`- Lessons: ${lessonCount}`);
};

runSeed()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });

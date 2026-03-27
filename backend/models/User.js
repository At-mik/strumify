import mongoose from "mongoose";

const practiceHistorySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    minutes: { type: Number, default: 0 },
    lessonsCompleted: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    xp: {
      type: Number,
      default: 0,
      min: 0
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    rankTitle: {
      type: String,
      default: "Beginner"
    },
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson"
      }
    ],
    badges: {
      type: [String],
      default: []
    },
    totalPracticeMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    todayPracticeMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    streak: {
      type: Number,
      default: 0,
      min: 0
    },
    lastPracticeDate: {
      type: String,
      default: null
    },
    practiceHistory: {
      type: [practiceHistorySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("User", userSchema);

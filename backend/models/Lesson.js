import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    order: {
      type: Number,
      required: true,
      min: 1
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    xpReward: {
      type: Number,
      required: true,
      min: 1,
      default: 50
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    chordDiagrams: {
      type: [String],
      default: []
    },
    practiceInstructions: {
      type: [String],
      default: []
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true
    }
  },
  {
    timestamps: true
  }
);

lessonSchema.index({ courseId: 1, order: 1 }, { unique: true });
lessonSchema.index({ moduleId: 1, order: 1 });

export default mongoose.model("Lesson", lessonSchema);

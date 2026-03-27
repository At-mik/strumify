import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
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
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    }
  },
  {
    timestamps: true
  }
);

moduleSchema.index({ courseId: 1, order: 1 }, { unique: true });

export default mongoose.model("Module", moduleSchema);

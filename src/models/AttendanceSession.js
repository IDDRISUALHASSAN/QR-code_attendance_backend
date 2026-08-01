import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    courseAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseAssignment",
      required: true,
    },

    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    qrToken: {
      type: String,
      required: true,
      unique: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const AttendanceSession = mongoose.model(
  "AttendanceSession",
  attendanceSessionSchema
);

export default AttendanceSession;
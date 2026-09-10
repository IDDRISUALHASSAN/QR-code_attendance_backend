import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true,
    },

    status: {
      type: String,
      default: "Present",
    },

    // ==========================================
    // STUDENT GPS LOCATION
    // ==========================================

    studentLatitude: {
      type: Number,
      default: null,
    },

    studentLongitude: {
      type: Number,
      default: null,
    },

    studentAccuracy: {
      type: Number,
      default: null,
    },

    // ==========================================
    // DISTANCE FROM LECTURER
    // ==========================================

    distanceFromLecturer: {
      type: Number,
      default: null,
    },

    // ==========================================
    // LOCATION VERIFICATION
    // ==========================================

    locationVerified: {
      type: Boolean,
      default: false,
    },

    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Attendance",
  attendanceSchema
);
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

    distanceFromLecturer: {
      type: Number,
      default: null,
    },

    locationVerified: {
      type: Boolean,
      default: false,
    },

    // Identifies the browser/device that scanned this attendance session.
    // The value is generated on the student's device and stored in localStorage.
    scanDeviceId: {
      type: String,
      required: true,
      trim: true,
    },

    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/*
 * Prevent the same device/browser from recording attendance
 * more than once for the same attendance session.
 *
 * partialFilterExpression is used so existing attendance
 * records that were created before scanDeviceId was added
 * will not cause a duplicate-index problem.
 */
attendanceSchema.index(
  { session: 1, scanDeviceId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      scanDeviceId: { $type: "string" },
    },
  }
);

export default mongoose.model("Attendance", attendanceSchema);
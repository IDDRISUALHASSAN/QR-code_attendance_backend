import mongoose from "mongoose";

const courseAssignmentSchema = new mongoose.Schema(
  {
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

    academicYear: {
      type: String,
      required: true,
    },

    semester: {
      type: String,
      enum: [
        "First Semester",
        "Second Semester",
      ],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CourseAssignment = mongoose.model(
  "CourseAssignment",
  courseAssignmentSchema
);

export default CourseAssignment;
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
import crypto from "crypto";

import AttendanceSession from "../models/AttendanceSession.js";
import CourseAssignment from "../models/CourseAssignment.js";

// Start Attendance Session
export const startAttendanceSession = async (req, res) => {

    try {

const { courseAssignmentId, duration = 15, } = req.body;
        if (!courseAssignmentId) {

            return res.status(400).json({
                message: "Course Assignment is required."
            });

        }

        // Check assignment

        const assignment =
            await CourseAssignment.findById(courseAssignmentId);

        if (!assignment) {

            return res.status(404).json({
                message: "Course Assignment not found."
            });

        }

        // Check if active session already exists

        const activeSession =
            await AttendanceSession.findOne({

                courseAssignment: courseAssignmentId,

                status: "active"

            });

        if (activeSession) {

    return res.status(200).json({

        message: "Attendance session is already active.",

        session: activeSession,

    });

}

        // Generate secure token

        const qrToken =
            crypto.randomBytes(16).toString("hex");

        const startTime = new Date();

        const endTime = new Date( startTime.getTime() + Number(duration) * 60 * 1000

    );

        const session =
            await AttendanceSession.create({

                courseAssignment: assignment._id,

                lecturer: assignment.lecturer,

                course: assignment.course,

                qrToken,

                startTime,

                endTime,

            });

        res.status(201).json({

            message:
                "Attendance session started successfully.",

            session,

        });

    } catch (error) {

        res.status(500).json({

            message: "Server error.",

            error: error.message,

        });

    }

};

export const getAttendanceSessions = async (req, res) => {

    try {

        const sessions = await AttendanceSession.find()

            .populate({
                path: "lecturer",
                select: "name staffId",
            })

            .populate({
                path: "course",
                select: "courseName courseCode",
            })

            .populate({
                path: "courseAssignment",
                select: "academicYear semester",
            })

            .sort({ createdAt: -1 });

        res.status(200).json({
            sessions,
        });

    } catch (error) {

        res.status(500).json({
            message: "Server error.",
            error: error.message,
        });

    }

};


export const closeAttendanceSession = async (req, res) => {

    try {

        const session =
            await AttendanceSession.findById(req.params.id);

        if (!session) {

            return res.status(404).json({
                message: "Attendance session not found.",
            });

        }

        session.status = "closed";

        await session.save();

       res.status(200).json({

    message: "Attendance session closed successfully.",

    session,

});

    } catch (error) {

        res.status(500).json({
            message: "Server error.",
            error: error.message,
        });

    }

};

import Attendance from "../models/Attendance.js";
import AttendanceSession from "../models/AttendanceSession.js";

export const scanAttendance = async (req, res) => {

    try {

        const { qrToken, studentId } = req.body;

        if (!qrToken || !studentId) {

            return res.status(400).json({
                message: "QR Token and Student ID are required."
            });

        }
        



        // 1. Check QR Token

        const session = await AttendanceSession.findOne({
            qrToken,
        });

        if (!session) {

            return res.status(404).json({
                message: "Invalid QR Code."
            });

        }

        // 2. Check Session Status

        if (session.status !== "active") {

            return res.status(400).json({
                message: "Attendance session is closed."
            });

        }

        // 3. Check Expiry

        if (new Date() > session.endTime) {

            session.status = "closed";

            await session.save();

            return res.status(400).json({
                message: "QR Code has expired."
            });

        }

        // 4. Check Duplicate Scan

        const alreadyScanned =
            await Attendance.findOne({

                student: studentId,

                session: session._id,

            });

        if (alreadyScanned) {

            return res.status(400).json({

                message:
                    "Attendance already recorded."

            });

        }

        // Save Attendance

        const attendance =
            await Attendance.create({

                student: studentId,

                lecturer: session.lecturer,

                course: session.course,

                session: session._id,

            });

        res.status(201).json({

            message:
                "Attendance recorded successfully.",

            attendance,

        });

    }

    catch (error) {

        res.status(500).json({

            message: "Server error.",

            error: error.message,

        });

    }

};

export const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;

        const attendanceRecords = await Attendance.find({
            student: studentId,
        })
            .populate({
                path: "session",
                select: "course lecturer startTime endTime status",
                populate: [
                    {
                        path: "course",
                        select: "courseName courseCode",
                    },
                    {
                        path: "lecturer",
                        select: "name email",
                    },
                ],
            })
            .populate({
                path: "course",
                select: "courseName courseCode",
            })
            .populate({
                path: "lecturer",
                select: "name email",
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            attendance: attendanceRecords,
        });
    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message,
        });
    }
};

export const getLecturerAttendanceSessions = async (req, res) => {
    try {
        const { lecturerId } = req.params;

        const sessions = await AttendanceSession.find({
            lecturer: lecturerId,
        })
            .populate({
                path: "course",
                select: "courseName courseCode",
            })
            .populate({
                path: "courseAssignment",
                select: "academicYear semester",
            })
            .sort({
                createdAt: -1,
            });

        const results = await Promise.all(
            sessions.map(async (session) => {
                const totalStudents = await Attendance.countDocuments({
                    session: session._id,
                });
                return {
                    ...session.toObject(),
                    totalStudents,
                };
            })
        );

        res.status(200).json({
            sessions: results,
        });
    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message,
        });
    }
};


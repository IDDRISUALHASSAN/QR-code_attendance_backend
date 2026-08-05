import User from "../models/User.js";
import Course from "../models/Course.js";
import AttendanceSession from "../models/AttendanceSession.js";

export const getAdminDashboard = async (req, res) => {

    try {

        const totalStudents = await User.countDocuments({
            role: "student",
        });

        const totalLecturers = await User.countDocuments({
            role: "lecturer",
        });

        const totalCourses = await Course.countDocuments();

        const activeSessions = await AttendanceSession.countDocuments({
            status: "active",
        });

        res.status(200).json({

            totalStudents,

            totalLecturers,

            totalCourses,

            activeSessions,

        });

    }

    catch (error) {

        res.status(500).json({

            message: "Server Error",

            error: error.message,

        });

    }

};
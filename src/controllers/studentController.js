import User from "../models/User.js";

// Get all students
export const getStudents = async (req, res) => {
    try {

        const students = await User.find({
            role: "student",
        }).select("-password");

        res.status(200).json({
            students,
        });

    } catch (error) {

        res.status(500).json({
            message: "Server Error",
            error: error.message,
        });

    }
};
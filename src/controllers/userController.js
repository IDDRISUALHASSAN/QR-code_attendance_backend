import User from "../models/User.js";

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      users,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

// Get all lecturers
export const getLecturers = async (req, res) => {
  try {
    const lecturers = await User.find({
      role: "lecturer",
    }).select("-password");

    res.status(200).json({
      lecturers,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

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
      message: "Server error.",
      error: error.message,
    });
  }
};

// Get all admins
export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      role: "admin",
    }).select("-password");

    res.status(200).json({
      admins,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

// Get one user
export const getUserById = async (req, res) => {
  try {

    const user = await User.findById(
      req.params.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json({
      user,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};
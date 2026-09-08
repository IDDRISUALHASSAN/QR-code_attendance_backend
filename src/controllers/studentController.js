import User from "../models/User.js";
import bcrypt from "bcryptjs";


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

// Add student — Admin only
export const createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      indexNumber,
      department,
      level,
    } = req.body;

    if (!name || !email || !password || !indexNumber) {
      return res.status(400).json({
        message:
          "Name, email, password and index number are required.",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "student",
      indexNumber: indexNumber.trim(),
      department: department || null,
      level: level || null,
      staffId: null,
      isVerified: true,
    });

    const studentResponse = student.toObject();
    delete studentResponse.password;

    res.status(201).json({
      message: "Student created successfully.",
      student: studentResponse,
    });
  } catch (error) {
    console.error("Create student error:", error);

    res.status(500).json({
      message: "Server error while creating student.",
      error: error.message,
    });
  }
};
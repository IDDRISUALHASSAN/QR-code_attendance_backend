import User from "../models/User.js";
import bcrypt from "bcryptjs";


// Update lecturer
export const updateLecturer = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      staffId,
      department,
    } = req.body;

    const lecturer = await User.findOne({
      _id: id,
      role: "lecturer",
    });

    if (!lecturer) {
      return res.status(404).json({
        message: "Lecturer not found.",
      });
    }

    lecturer.name = name;
    lecturer.email = email;
    lecturer.staffId = staffId;
    lecturer.department = department;

    await lecturer.save();

    const updatedLecturer = lecturer.toObject();

    delete updatedLecturer.password;

    res.status(200).json({
      message: "Lecturer updated successfully.",
      lecturer: updatedLecturer,
    });

 


} catch (error) {

    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });

  }
};

// Delete lecturer
export const deleteLecturer = async (req, res) => {
  try {
    const { id } = req.params;

    const lecturer = await User.findOne({
      _id: id,
      role: "lecturer",
    });

    if (!lecturer) {
      return res.status(404).json({
        message: "Lecturer not found.",
      });
    }

    await lecturer.deleteOne();

    res.status(200).json({
      message: "Lecturer deleted successfully.",
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });

  }
};
// Add lecturer — Admin only
export const createLecturer = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      staffId,
      department,
    } = req.body;

    if (!name || !email || !password || !staffId) {
      return res.status(400).json({
        message:
          "Name, email, password and staff ID are required.",
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

    const existingStaff = await User.findOne({
      staffId: staffId.trim(),
    });

    if (existingStaff) {
      return res.status(400).json({
        message: "A lecturer with this staff ID already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const lecturer = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "lecturer",
      staffId: staffId.trim(),
      department: department || null,
      indexNumber: null,
      level: null,
      isVerified: true,
    });

    const lecturerResponse = lecturer.toObject();
    delete lecturerResponse.password;

    res.status(201).json({
      message: "Lecturer created successfully.",
      lecturer: lecturerResponse,
    });
  } catch (error) {
    console.error("Create lecturer error:", error);

    res.status(500).json({
      message: "Server error while creating lecturer.",
      error: error.message,
    });
  }
};

// Get all lecturers
export const getLecturers = async (req, res) => {
  try {
    const lecturers = await User.find({ role: "lecturer" }).select("-password");

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
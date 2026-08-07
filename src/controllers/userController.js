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


// ========================================
// UPDATE STUDENT
// ========================================

export const updateStudent = async (req, res) => {

  try {

    const {
      name,
      email,
      indexNumber,
      department,
      level,
    } = req.body;


    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    });


    if (!student) {

      return res.status(404).json({
        message: "Student not found.",
      });

    }


    // Check if another user already has this email

    if (email && email !== student.email) {

      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: student._id },
      });


      if (existingUser) {

        return res.status(400).json({
          message: "Email is already in use.",
        });

      }

    }


    // Update allowed fields

    if (name !== undefined) {
      student.name = name;
    }

    if (email !== undefined) {
      student.email = email.toLowerCase();
    }

    if (indexNumber !== undefined) {
      student.indexNumber = indexNumber;
    }

    if (department !== undefined) {
      student.department = department;
    }

    if (level !== undefined) {
      student.level = level;
    }


    await student.save();


    const updatedStudent =
      student.toObject();

    delete updatedStudent.password;


    res.status(200).json({

      message: "Student updated successfully.",

      student: updatedStudent,

    });


  } catch (error) {

    res.status(500).json({

      message: "Server error.",

      error: error.message,

    });

  }

};


export const deleteStudent = async (req, res) => {

  try {

    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    });


    if (!student) {

      return res.status(404).json({
        message: "Student not found.",
      });

    }


    await User.findByIdAndDelete(
      student._id
    );


    res.status(200).json({

      message:
        "Student deleted successfully.",

    });


  } catch (error) {

    res.status(500).json({

      message: "Server error.",

      error: error.message,

    });

  }

  


};


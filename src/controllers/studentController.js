import User from "../models/User.js";
import bcrypt from "bcryptjs";

// =========================================================
// GET ALL STUDENTS
// =========================================================

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

// =========================================================
// CREATE STUDENT — ADMIN ONLY
// =========================================================

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
      className: null,
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

// =========================================================
// ORGANIZE STUDENTS INTO FIVE CLASSES
// =========================================================
// Students are organized separately within each
// Department + Level group.
//
// Classes:
// Class A
// Class B
// Class C
// Class D
// Class E
//
// Students are randomly shuffled and then distributed
// evenly using round-robin assignment.
// =========================================================

export const organizeStudents = async (req, res) => {
  try {
    const classNames = [
      "Class A",
      "Class B",
      "Class C",
      "Class D",
      "Class E",
    ];

    const students = await User.find({
      role: "student",
      $or: [
        { className: null },
        { className: "" },
        { className: { $exists: false } },
      ],
    }).select("_id name department level className");

    if (students.length === 0) {
      return res.status(200).json({
        message:
          "All students are already organized into classes.",
        assignedCount: 0,
        groups: [],
      });
    }

    const groups = new Map();

    for (const student of students) {
      const department =
        student.department?.trim() ||
        "Unassigned Department";

      const level =
        student.level?.toString().trim() ||
        "Unassigned Level";

      const key = `${department}::${level}`;

      if (!groups.has(key)) {
        groups.set(key, {
          department,
          level,
          students: [],
        });
      }

      groups.get(key).students.push(student);
    }

    const operations = [];
    const summaries = [];

    for (const group of groups.values()) {
      const shuffledStudents = [...group.students];

      for (
        let i = shuffledStudents.length - 1;
        i > 0;
        i -= 1
      ) {
        const randomIndex = Math.floor(
          Math.random() * (i + 1)
        );

        [
          shuffledStudents[i],
          shuffledStudents[randomIndex],
        ] = [
          shuffledStudents[randomIndex],
          shuffledStudents[i],
        ];
      }

      const classCounts = {
        "Class A": 0,
        "Class B": 0,
        "Class C": 0,
        "Class D": 0,
        "Class E": 0,
      };

      shuffledStudents.forEach((student, index) => {
        const className =
          classNames[index % classNames.length];

        operations.push({
          updateOne: {
            filter: {
              _id: student._id,
            },
            update: {
              $set: {
                className,
              },
            },
          },
        });

        classCounts[className] += 1;
      });

      summaries.push({
        department: group.department,
        level: group.level,
        totalStudents: group.students.length,
        classes: classCounts,
      });
    }

    if (operations.length > 0) {
      await User.bulkWrite(operations);
    }

    res.status(200).json({
      message: `${students.length} student${
        students.length === 1 ? "" : "s"
      } organized successfully.`,

      assignedCount: students.length,

      groups: summaries,
    });
  } catch (error) {
    console.error(
      "Organize students error:",
      error
    );

    res.status(500).json({
      message:
        "Server error while organizing students.",
      error: error.message,
    });
  }
};

// =========================================================
// UPDATE STUDENT — ADMIN ONLY
// =========================================================

export const updateStudent = async (req, res) => {
  try {
    const { name, email, indexNumber, department, level } = req.body;

    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    if (
      email !== undefined &&
      email.toLowerCase().trim() !== student.email
    ) {
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: student._id },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Email is already in use.",
        });
      }
    }

    if (name !== undefined) {
      student.name = name.trim();
    }

    if (email !== undefined) {
      student.email = email.toLowerCase().trim();
    }

    if (indexNumber !== undefined) {
      student.indexNumber = indexNumber.trim();
    }

    if (department !== undefined) {
      student.department = department || null;
    }

    if (level !== undefined) {
      student.level = level || null;
    }

    await student.save();

    const updatedStudent = student.toObject();

    delete updatedStudent.password;

    res.status(200).json({
      message: "Student updated successfully.",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Update student error:", error);

    res.status(500).json({
      message: "Server error while updating student.",
      error: error.message,
    });
  }
};

// =========================================================
// DELETE STUDENT — ADMIN ONLY
// =========================================================

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

    await User.findByIdAndDelete(student._id);

    res.status(200).json({
      message: "Student deleted successfully.",
    });
  } catch (error) {
    console.error("Delete student error:", error);

    res.status(500).json({
      message: "Server error while deleting student.",
      error: error.message,
    });
  }
};
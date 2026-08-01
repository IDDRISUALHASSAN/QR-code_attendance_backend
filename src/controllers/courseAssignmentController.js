import CourseAssignment from "../models/CourseAssignment.js";
import User from "../models/User.js";
import Course from "../models/Course.js";

// Assign a course to a lecturer
export const assignCourse = async (req, res) => {
  try {
    const {
      lecturer,
      course,
      academicYear,
      semester,
    } = req.body;

    if (
      !lecturer ||
      !course ||
      !academicYear ||
      !semester
    ) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    // Check lecturer
    const lecturerExists = await User.findById(lecturer);

    if (!lecturerExists || lecturerExists.role !== "lecturer") {
      return res.status(404).json({
        message: "Lecturer not found.",
      });
    }

    // Check course
    const courseExists = await Course.findById(course);

    if (!courseExists) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    // Prevent duplicate assignment
    const existingAssignment =
      await CourseAssignment.findOne({
        lecturer,
        course,
        academicYear,
        semester,
      });

    if (existingAssignment) {
      return res.status(400).json({
        message: "This course has already been assigned to the lecturer.",
      });
    }

    const assignment =
      await CourseAssignment.create({
        lecturer,
        course,
        academicYear,
        semester,
      });

    res.status(201).json({
      message: "Course assigned successfully.",
      assignment,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

// Get all assignments
export const getAssignments = async (req, res) => {
  try {

    const assignments = await CourseAssignment.find()

      .populate({
        path: "lecturer",
        select: "name staffId email department",
      })

      .populate({
        path: "course",
        select: "courseName courseCode department level",
      })

      .sort({ createdAt: -1 });

    res.status(200).json({
      assignments,
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });

  }
};


export const getLecturerAssignments = async (req, res) => {

    try {

        const { lecturerId } = req.params;

        const assignments =
            await CourseAssignment.find({

                lecturer: lecturerId,

            })

            .populate({

                path: "course",

                select:
                    "courseName courseCode department level",

            })

            .sort({

                createdAt: -1,

            });

        res.status(200).json({

            assignments,

        });

    } catch (error) {

        res.status(500).json({

            message: "Server error.",

            error: error.message,

        });

    }

};

// Delete assignment
export const deleteAssignment = async (req, res) => {
  try {
    const assignment =
      await CourseAssignment.findByIdAndDelete(
        req.params.id
      );

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found.",
      });
    }

    res.status(200).json({
      message: "Assignment removed successfully.",
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};
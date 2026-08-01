import Course from "./models/Course.js";

// Add a new course
export const createCourse = async (req, res) => {
  try {
    const {
      courseName,
      courseCode,
      department,
      level,
    } = req.body;

    if (
      !courseName ||
      !courseCode ||
      !department ||
      !level
    ) {
      return res.status(400).json({
        message: "All course fields are required.",
      });
    }

    const existingCourse = await Course.findOne({
      courseCode: courseCode.toUpperCase(),
    });

    if (existingCourse) {
      return res.status(400).json({
        message: "A course with this course code already exists.",
      });
    }

    const course = await Course.create({
      courseName,
      courseCode,
      department,
      level,
    });

    res.status(201).json({
      message: "Course added successfully.",
      course,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while adding course.",
      error: error.message,
    });
  }
};

// Get all courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      courses,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while getting courses.",
      error: error.message,
    });
  }
};

// Get one course
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(
      req.params.id
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    res.status(200).json({
      course,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while getting the course.",
      error: error.message,
    });
  }
};

// Update a course
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    res.status(200).json({
      message: "Course updated successfully.",
      course,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while updating course.",
      error: error.message,
    });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(
      req.params.id
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    res.status(200).json({
      message: "Course deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while deleting course.",
      error: error.message,
    });
  }
};
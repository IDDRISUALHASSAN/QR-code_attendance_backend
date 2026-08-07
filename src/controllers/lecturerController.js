import User from "../models/User.js";
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
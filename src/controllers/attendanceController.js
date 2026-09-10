import Attendance from "../models/Attendance.js";
import AttendanceSession from "../models/AttendanceSession.js";

/*
|--------------------------------------------------------------------------
| Scan Attendance
|--------------------------------------------------------------------------
*/
export const scanAttendance = async (req, res) => {
  try {
    const {
      qrToken,
      studentId,
      latitude,
      longitude,
      accuracy,
      distanceFromLecturer,
    } = req.body;

    // ---------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------
    if (!qrToken || !studentId) {
      return res.status(400).json({
        message: "QR Token and Student ID are required.",
      });
    }

    // ---------------------------------------------------------
    // Validate student GPS
    // ---------------------------------------------------------
    const studentLatitude = Number(latitude);
    const studentLongitude = Number(longitude);
    const studentAccuracy =
      accuracy !== undefined && accuracy !== null
        ? Number(accuracy)
        : null;

    const recordedDistance =
      distanceFromLecturer !== undefined &&
      distanceFromLecturer !== null
        ? Number(distanceFromLecturer)
        : null;

    if (
      !Number.isFinite(studentLatitude) ||
      !Number.isFinite(studentLongitude)
    ) {
      return res.status(400).json({
        message:
          "Valid student location is required to record attendance.",
      });
    }

    // ---------------------------------------------------------
    // Check QR Token
    // ---------------------------------------------------------
    const session = await AttendanceSession.findOne({
      qrToken,
    });

    if (!session) {
      return res.status(404).json({
        message: "Invalid QR Code.",
      });
    }

    // ---------------------------------------------------------
    // Check Session Status
    // ---------------------------------------------------------
    if (session.status !== "active") {
      return res.status(400).json({
        message: "Attendance session is closed.",
      });
    }

    // ---------------------------------------------------------
    // Check Expiry
    // ---------------------------------------------------------
    if (new Date() > session.endTime) {
      session.status = "closed";
      await session.save();

      return res.status(400).json({
        message: "QR Code has expired.",
      });
    }

    // ---------------------------------------------------------
    // Check lecturer GPS
    // ---------------------------------------------------------
    const lecturerLatitude = Number(
      session.lecturerLatitude
    );

    const lecturerLongitude = Number(
      session.lecturerLongitude
    );

    if (
      !Number.isFinite(lecturerLatitude) ||
      !Number.isFinite(lecturerLongitude)
    ) {
      return res.status(500).json({
        message:
          "Lecturer location is not available for this attendance session.",
      });
    }

    // ---------------------------------------------------------
    // Check distance
    // ---------------------------------------------------------
    if (
      recordedDistance === null ||
      !Number.isFinite(recordedDistance)
    ) {
      return res.status(400).json({
        message:
          "Unable to verify your distance from the lecturer.",
      });
    }

    // ---------------------------------------------------------
    // 50-meter attendance rule
    // ---------------------------------------------------------
    if (recordedDistance > 50) {
      return res.status(403).json({
        message: `Attendance rejected. You are ${recordedDistance.toFixed(
          1
        )} meters away from the lecturer. You must be within 50 meters.`,
      });
    }

    // ---------------------------------------------------------
    // Check Duplicate Scan
    // ---------------------------------------------------------
    const alreadyScanned = await Attendance.findOne({
      student: studentId,
      session: session._id,
    });

    if (alreadyScanned) {
      return res.status(400).json({
        message: "Attendance already recorded.",
      });
    }

    // ---------------------------------------------------------
    // Location verification
    // ---------------------------------------------------------
    const locationVerified = recordedDistance <= 50;

    // ---------------------------------------------------------
    // Save Attendance
    // ---------------------------------------------------------
    const attendance = await Attendance.create({
      student: studentId,
      lecturer: session.lecturer,
      course: session.course,
      session: session._id,

      status: "Present",

      studentLatitude,
      studentLongitude,
      studentAccuracy: Number.isFinite(studentAccuracy)
        ? studentAccuracy
        : null,

      distanceFromLecturer: recordedDistance,

      locationVerified,
    });

    // ---------------------------------------------------------
    // Successful response
    // ---------------------------------------------------------
    return res.status(201).json({
      message: "Attendance recorded successfully.",
      attendance,
    });
  } catch (error) {
    console.error(
      "SCAN ATTENDANCE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Student Attendance
|--------------------------------------------------------------------------
*/
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    const attendance = await Attendance.find({
      student: studentId,
    })
      .populate({
        path: "course",
        select: "courseName courseCode",
      })
      .populate({
        path: "lecturer",
        select: "name email",
      })
      .populate({
        path: "session",
        select:
          "startTime endTime status lecturerLatitude lecturerLongitude",
      })
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      attendance,
    });
  } catch (error) {
    console.error(
      "GET STUDENT ATTENDANCE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Lecturer Attendance Sessions
|--------------------------------------------------------------------------
*/
export const getLecturerAttendanceSessions = async (
  req,
  res
) => {
  try {
    const { lecturerId } = req.params;

    const sessions = await AttendanceSession.find({
      lecturer: lecturerId,
    })
      .populate({
        path: "course",
        select: "courseName courseCode",
      })
      .populate({
        path: "courseAssignment",
        select: "academicYear semester",
      })
      .sort({
        createdAt: -1,
      });

    const results = await Promise.all(
      sessions.map(async (session) => {
        const totalStudents =
          await Attendance.countDocuments({
            session: session._id,
          });

        return {
          ...session.toObject(),
          totalStudents,
        };
      })
    );

    return res.status(200).json({
      sessions: results,
    });
  } catch (error) {
    console.error(
      "GET LECTURER ATTENDANCE SESSIONS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Session Attendance
|--------------------------------------------------------------------------
*/
export const getSessionAttendance = async (
  req,
  res
) => {
  try {
    const { sessionId } = req.params;

    const attendance = await Attendance.find({
      session: sessionId,
    })
      .populate({
        path: "student",
        select: "name indexNumber email",
      })
      .sort({
        scannedAt: 1,
      });

    return res.status(200).json({
      attendance,
    });
  } catch (error) {
    console.error(
      "GET SESSION ATTENDANCE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get All Attendance - Admin
|--------------------------------------------------------------------------
*/
export const getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate({
        path: "student",
        select: "name indexNumber email",
      })
      .populate({
        path: "lecturer",
        select: "name staffId email",
      })
      .populate({
        path: "course",
        select: "courseName courseCode",
      })
      .populate({
        path: "session",
        select:
          "startTime endTime status lecturerLatitude lecturerLongitude",
      })
      .sort({
        scannedAt: -1,
      });

    return res.status(200).json({
      attendance,
    });
  } catch (error) {
    console.error(
      "GET ALL ATTENDANCE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
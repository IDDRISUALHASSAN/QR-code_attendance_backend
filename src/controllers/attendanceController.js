import Attendance from "../models/Attendance.js";
import AttendanceSession from "../models/AttendanceSession.js";

/*
|--------------------------------------------------------------------------
| Scan Attendance
|--------------------------------------------------------------------------
*/

export const scanAttendance = async (req, res) => {
  try {
    console.log("========== SCAN ATTENDANCE ==========");
    console.log("BODY:", req.body);

    const {
      qrToken,
      studentId,
      latitude,
      longitude,
      accuracy,
      distanceFromLecturer,
    } = req.body;

    // --------------------------------------------------
    // 1. Validate required data
    // --------------------------------------------------
    if (!qrToken) {
      return res.status(400).json({
        message: "QR token is required",
      });
    }

    if (!studentId) {
      return res.status(400).json({
        message: "Student ID is required",
      });
    }

    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        message: "Student location is required",
      });
    }

    // --------------------------------------------------
    // 2. Validate student coordinates
    // --------------------------------------------------
    const studentLatitude = Number(latitude);
    const studentLongitude = Number(longitude);
    const studentAccuracy =
      accuracy !== undefined && accuracy !== null
        ? Number(accuracy)
        : null;

    if (
      !Number.isFinite(studentLatitude) ||
      !Number.isFinite(studentLongitude)
    ) {
      return res.status(400).json({
        message: "Invalid student GPS coordinates",
      });
    }

    // --------------------------------------------------
    // 3. Find attendance session
    // --------------------------------------------------
    const session = await AttendanceSession.findOne({
      qrToken,
    });

    console.log("SESSION:", session);

    if (!session) {
      return res.status(404).json({
        message: "Attendance session not found",
      });
    }

    // --------------------------------------------------
    // 4. Check session status
    // --------------------------------------------------
    if (session.status !== "active") {
      return res.status(400).json({
        message: "Attendance session is closed",
      });
    }

    // --------------------------------------------------
    // 5. Check session expiry
    // --------------------------------------------------
    if (session.endTime && new Date() > new Date(session.endTime)) {
      return res.status(400).json({
        message: "Attendance session has expired",
      });
    }

    // --------------------------------------------------
    // 6. Make sure lecturer GPS exists
    // --------------------------------------------------
    if (
      session.lecturerLatitude === undefined ||
      session.lecturerLatitude === null ||
      session.lecturerLongitude === undefined ||
      session.lecturerLongitude === null
    ) {
      return res.status(400).json({
        message: "Lecturer location is not available for this session",
      });
    }

    // --------------------------------------------------
    // 7. Validate distance
    // --------------------------------------------------
    const calculatedDistance =
      distanceFromLecturer !== undefined &&
      distanceFromLecturer !== null
        ? Number(distanceFromLecturer)
        : null;

    if (
      calculatedDistance === null ||
      !Number.isFinite(calculatedDistance)
    ) {
      return res.status(400).json({
        message: "Distance from lecturer is required",
      });
    }

    console.log("Student latitude:", studentLatitude);
    console.log("Student longitude:", studentLongitude);
    console.log("Student accuracy:", studentAccuracy);
    console.log("Distance:", calculatedDistance);

    // --------------------------------------------------
    // 8. 50 metre attendance rule
    // --------------------------------------------------
    const ALLOWED_RADIUS = 2000000;

    if (calculatedDistance > ALLOWED_RADIUS) {
      return res.status(403).json({
        message: `You are ${Math.round(
          calculatedDistance
        )}m away from the lecturer. You must be within ${ALLOWED_RADIUS}m.`,
        distance: calculatedDistance,
        allowedRadius: ALLOWED_RADIUS,
      });
    }

    // --------------------------------------------------
    // 9. Check duplicate attendance
    // --------------------------------------------------
    const alreadyScanned = await Attendance.findOne({
      student: studentId,
      session: session._id,
    });

    console.log("ALREADY SCANNED:", alreadyScanned);

    if (alreadyScanned) {
      return res.status(409).json({
        message: "You have already marked attendance for this session",
      });
    }

    // --------------------------------------------------
    // 10. Create attendance record
    // --------------------------------------------------
    console.log("Creating attendance...");

    const attendance = await Attendance.create({
      student: studentId,
      lecturer: session.lecturer,
      course: session.course,
      session: session._id,
      status: "Present",

      studentLatitude,
      studentLongitude,
      studentAccuracy,

      distanceFromLecturer: calculatedDistance,
      locationVerified: true,
    });

    console.log("ATTENDANCE CREATED:", attendance);

    // --------------------------------------------------
    // 11. Success
    // --------------------------------------------------
    return res.status(201).json({
      message: "Attendance recorded successfully",
      attendance,
    });
  } catch (error) {
    // VERY IMPORTANT
    console.error("====================================");
    console.error("SCAN ATTENDANCE ERROR");
    console.error("NAME:", error.name);
    console.error("MESSAGE:", error.message);
    console.error("STACK:", error.stack);
    console.error("====================================");

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
      errorName: error.name,
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
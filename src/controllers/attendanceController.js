import Attendance from "../models/Attendance.js";
import AttendanceSession from "../models/AttendanceSession.js";
import User from "../models/User.js";


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
      accuracy !== undefined &&
      accuracy !== null
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

    const session =
      await AttendanceSession.findOne({
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

    if (
      session.endTime &&
      new Date() > new Date(session.endTime)
    ) {
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
        message:
          "Lecturer location is not available for this session",
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
        message:
          "Distance from lecturer is required",
      });
    }

    console.log(
      "Student latitude:",
      studentLatitude
    );

    console.log(
      "Student longitude:",
      studentLongitude
    );

    console.log(
      "Student accuracy:",
      studentAccuracy
    );

    console.log(
      "Distance:",
      calculatedDistance
    );

    // --------------------------------------------------
    // 8. Attendance distance rule
    // --------------------------------------------------

    const ALLOWED_RADIUS = 300000;

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

    const alreadyScanned =
      await Attendance.findOne({
        student: studentId,
        session: session._id,
      });

    console.log(
      "ALREADY SCANNED:",
      alreadyScanned
    );

    if (alreadyScanned) {
      return res.status(409).json({
        message:
          "You have already marked attendance for this session",
      });
    }

    // --------------------------------------------------
    // 10. Create attendance record
    // --------------------------------------------------

    console.log("Creating attendance...");

    const attendance =
      await Attendance.create({
        student: studentId,
        lecturer: session.lecturer,
        course: session.course,
        session: session._id,
        status: "Present",

        studentLatitude,
        studentLongitude,
        studentAccuracy,

        distanceFromLecturer:
          calculatedDistance,

        locationVerified: true,
      });

    console.log(
      "ATTENDANCE CREATED:",
      attendance
    );

    // --------------------------------------------------
    // 11. Success
    // --------------------------------------------------

    return res.status(201).json({
      message:
        "Attendance recorded successfully",
      attendance,
    });
  } catch (error) {
    console.error(
      "===================================="
    );

    console.error(
      "SCAN ATTENDANCE ERROR"
    );

    console.error(
      "NAME:",
      error.name
    );

    console.error(
      "MESSAGE:",
      error.message
    );

    console.error(
      "STACK:",
      error.stack
    );

    console.error(
      "===================================="
    );

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
export const getStudentAttendance = async (
  req,
  res
) => {
  try {
    const { studentId } = req.params;

    const attendance =
      await Attendance.find({
        student: studentId,
      })
        .populate({
          path: "course",
          select:
            "courseName courseCode department level",
        })
        .populate({
          path: "lecturer",
          select: "name email",
        })
        .populate({
          path: "session",
          select:
            "startTime endTime status lecturerLatitude lecturerLongitude className department level",
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
export const getLecturerAttendanceSessions =
  async (req, res) => {
    try {
      const { lecturerId } = req.params;

      const sessions =
        await AttendanceSession.find({
          lecturer: lecturerId,
        })
          .populate({
            path: "course",
            select:
              "courseName courseCode department level",
          })
          .populate({
            path: "courseAssignment",
            select:
              "academicYear semester",
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
| Get Complete Session Attendance
|--------------------------------------------------------------------------
|
| This returns the COMPLETE class roster.
|
| Students who scanned:
|     Present
|
| Students who did not scan:
|     Absent
|
|--------------------------------------------------------------------------
*/
export const getSessionAttendance = async (
  req,
  res
) => {
  try {
    const { sessionId } = req.params;

    // --------------------------------------------------
    // 1. Find session
    // --------------------------------------------------

    const session =
      await AttendanceSession.findById(
        sessionId
      ).populate({
        path: "course",
        select:
          "courseName courseCode department level",
      });

    if (!session) {
      return res.status(404).json({
        message:
          "Attendance session not found.",
      });
    }

    // --------------------------------------------------
    // 2. Get all attendance records
    // --------------------------------------------------

    const attendanceRecords =
      await Attendance.find({
        session: sessionId,
      })
        .populate({
          path: "student",
          select:
            "name indexNumber email department level className",
        })
        .sort({
          scannedAt: 1,
        });

    // --------------------------------------------------
    // 3. Legacy-session fallback
    // --------------------------------------------------

    const department =
      session.department ||
      session.course?.department;

    const level =
      session.level ||
      session.course?.level;

    const className =
      session.className;

    // --------------------------------------------------
    // 4. If this is an old session that does not
    //    contain class information, return the
    //    attendance records normally.
    // --------------------------------------------------

    if (!department || !level || !className) {
      const legacyAttendance =
        attendanceRecords.map((record) => ({
          ...record.toObject(),
          status:
            record.status || "Present",
        }));

      return res.status(200).json({
        session,
        attendance: legacyAttendance,
        totalStudents:
          legacyAttendance.length,
        presentCount:
          legacyAttendance.filter(
            (record) =>
              record.status === "Present"
          ).length,
        absentCount: 0,
        attendanceRate:
          legacyAttendance.length > 0
            ? 100
            : 0,
      });
    }

    // --------------------------------------------------
    // 5. Find the complete class roster
    // --------------------------------------------------

    const students = await User.find({
      role: "student",

      department: department,

      level: level,

      className: className,
    })
      .select(
        "name indexNumber email department level className"
      )
      .sort({
        name: 1,
      });

    // --------------------------------------------------
    // 6. Create attendance lookup
    // --------------------------------------------------

    const attendanceMap = new Map();

    attendanceRecords.forEach((record) => {
      if (record.student?._id) {
        attendanceMap.set(
          record.student._id.toString(),
          record
        );
      }
    });

    // --------------------------------------------------
    // 7. Merge roster with attendance
    // --------------------------------------------------

    const completeAttendance =
      students.map((student) => {
        const studentId =
          student._id.toString();

        const record =
          attendanceMap.get(studentId);

        if (record) {
          return {
            ...record.toObject(),

            student: student.toObject(),

            status:
              record.status || "Present",
          };
        }

        return {
          _id: `absent-${studentId}`,

          student: student.toObject(),

          session: session._id,

          course: session.course?._id,

          lecturer: session.lecturer,

          status: "Absent",

          scannedAt: null,

          studentLatitude: null,

          studentLongitude: null,

          studentAccuracy: null,

          distanceFromLecturer: null,

          locationVerified: false,
        };
      });

    // --------------------------------------------------
    // 8. Calculate statistics
    // --------------------------------------------------

    const totalStudents =
      completeAttendance.length;

    const presentCount =
      completeAttendance.filter(
        (record) =>
          record.status === "Present"
      ).length;

    const absentCount =
      completeAttendance.filter(
        (record) =>
          record.status === "Absent"
      ).length;

    const attendanceRate =
      totalStudents > 0
        ? Math.round(
            (presentCount /
              totalStudents) *
              100
          )
        : 0;

    // --------------------------------------------------
    // 9. Return complete attendance
    // --------------------------------------------------

    return res.status(200).json({
      session,

      attendance:
        completeAttendance,

      totalStudents,

      presentCount,

      absentCount,

      attendanceRate,
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
export const getAllAttendance = async (
  req,
  res
) => {
  try {
    const attendance =
      await Attendance.find()
        .populate({
          path: "student",
          select:
            "name indexNumber email department level className",
        })
        .populate({
          path: "lecturer",
          select:
            "name staffId email",
        })
        .populate({
          path: "course",
          select:
            "courseName courseCode department level",
        })
        .populate({
          path: "session",
          select:
            "startTime endTime status lecturerLatitude lecturerLongitude className department level",
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
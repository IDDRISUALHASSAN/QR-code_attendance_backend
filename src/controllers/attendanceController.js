import Attendance from "../models/Attendance.js";
import AttendanceSession from "../models/AttendanceSession.js";
import User from "../models/User.js";


// ============================================================
// HELPER: GET PERIOD DATE RANGE
// ============================================================
const getPeriodRange = (period, from, to) => {
  const now = new Date();

  // Start of current week: Monday
  const currentDay = now.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

  const thisWeekStart = new Date(now);
  thisWeekStart.setHours(0, 0, 0, 0);
  thisWeekStart.setDate(
    thisWeekStart.getDate() - daysFromMonday
  );

  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

  // Previous week
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const lastWeekEnd = new Date(thisWeekStart);

  if (period === "thisWeek") {
    return {
      start: thisWeekStart,
      end: thisWeekEnd,
    };
  }

  if (period === "lastWeek") {
    return {
      start: lastWeekStart,
      end: lastWeekEnd,
    };
  }

  if (period === "bothWeeks") {
    return {
      start: lastWeekStart,
      end: thisWeekEnd,
    };
  }

  if (period === "custom") {
    if (!from || !to) {
      return null;
    }

    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59.999`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }

    return {
      start,
      end,
    };
  }

  return null;
};


// ============================================================
// SCAN ATTENDANCE
// ============================================================
export const scanAttendance = async (req, res) => {
  try {
    const {
      qrToken,
      studentId,
      latitude,
      longitude,
      accuracy,
      distanceFromLecturer,
      scanDeviceId,
    } = req.body;

    if (!qrToken || !studentId) {
      return res.status(400).json({
        message: "QR token and student ID are required.",
      });
    }

    if (
      latitude === undefined ||
      latitude === null ||
      longitude === undefined ||
      longitude === null
    ) {
      return res.status(400).json({
        message: "Student GPS location is required.",
      });
    }

    if (!scanDeviceId) {
      return res.status(400).json({
        message: "Scanning device could not be identified.",
      });
    }

    const session = await AttendanceSession.findOne({ qrToken })
      .populate("course")
      .populate("lecturer");

    if (!session) {
      return res.status(404).json({
        message: "Attendance session not found.",
      });
    }

    if (session.status !== "active") {
      return res.status(400).json({
        message: "This attendance session is no longer active.",
      });
    }

    if (session.endTime && new Date() > new Date(session.endTime)) {
      return res.status(400).json({
        message: "This attendance session has expired.",
      });
    }

    if (
      session.lecturerLatitude === null ||
      session.lecturerLatitude === undefined ||
      session.lecturerLongitude === null ||
      session.lecturerLongitude === undefined
    ) {
      return res.status(400).json({
        message: "Lecturer location is not available for this session.",
      });
    }

    const ALLOWED_RADIUS = 300000;

    if (
      distanceFromLecturer === undefined ||
      distanceFromLecturer === null ||
      Number.isNaN(Number(distanceFromLecturer))
    ) {
      return res.status(400).json({
        message: "Student location could not be verified.",
      });
    }

    if (Number(distanceFromLecturer) > ALLOWED_RADIUS) {
      return res.status(403).json({
        message: "You are outside the allowed attendance area.",
      });
    }

    // Student cannot scan the same session twice.
    const alreadyScanned = await Attendance.findOne({
      student: studentId,
      session: session._id,
    });

    if (alreadyScanned) {
      return res.status(409).json({
        message: "You have already marked attendance for this session.",
      });
    }

    // One device/browser can only scan once per session.
    const deviceAlreadyScanned = await Attendance.findOne({
      session: session._id,
      scanDeviceId,
    });

    if (deviceAlreadyScanned) {
      return res.status(409).json({
        message:
          "This device has already been used to mark attendance for this session.",
      });
    }

    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    if (student.role !== "student") {
      return res.status(403).json({
        message: "Only students can mark attendance.",
      });
    }

    try {
      const attendance = await Attendance.create({
        student: studentId,
        lecturer: session.lecturer._id || session.lecturer,
        course: session.course._id || session.course,
        session: session._id,
        status: "Present",

        studentLatitude: Number(latitude),
        studentLongitude: Number(longitude),

        studentAccuracy:
          accuracy !== undefined && accuracy !== null
            ? Number(accuracy)
            : null,

        distanceFromLecturer: Number(distanceFromLecturer),
        locationVerified: true,

        scanDeviceId,
      });

      return res.status(201).json({
        message: "Attendance recorded successfully.",
        attendance,
      });
    } catch (createError) {
      if (createError.code === 11000) {
        return res.status(409).json({
          message:
            "This device has already been used to mark attendance for this session.",
        });
      }

      throw createError;
    }
  } catch (error) {
    console.error("Scan attendance error:", error);

    return res.status(500).json({
      message: "Failed to record attendance.",
      error: error.message,
    });
  }
};


// ============================================================
// GET STUDENT ATTENDANCE
// ============================================================
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    const attendance = await Attendance.find({
      student: studentId,
    })
      .populate("course", "courseName courseCode")
      .populate("lecturer", "name email")
      .populate(
        "session",
        "className department level date startTime endTime status"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json(attendance);
  } catch (error) {
    console.error("Get student attendance error:", error);

    return res.status(500).json({
      message: "Failed to fetch student attendance.",
      error: error.message,
    });
  }
};


// ============================================================
// GET LECTURER ATTENDANCE SESSIONS
// ============================================================
export const getLecturerAttendanceSessions = async (req, res) => {
  try {
    const { lecturerId } = req.params;

    const sessions = await AttendanceSession.find({
      lecturer: lecturerId,
    })
      .populate("course", "courseName courseCode")
      .populate(
        "courseAssignment",
        "academicYear semester"
      )
      .sort({ createdAt: -1 });

    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const studentCount = await Attendance.countDocuments({
          session: session._id,
        });

        return {
          ...session.toObject(),
          studentCount,
        };
      })
    );

    return res.status(200).json(sessionsWithCounts);
  } catch (error) {
    console.error(
      "Get lecturer attendance sessions error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch lecturer attendance sessions.",
      error: error.message,
    });
  }
};


// ============================================================
// GET LECTURER ATTENDANCE REPORT
// ============================================================
export const getLecturerAttendanceReport = async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const { period, from, to } = req.query;

    // Make sure the lecturer exists.
    const lecturer = await User.findById(lecturerId);

    if (!lecturer) {
      return res.status(404).json({
        message: "Lecturer not found.",
      });
    }

    // Security: lecturer can only access their own report.
    if (req.user._id.toString() !== lecturerId.toString()) {
      return res.status(403).json({
        message: "You can only access your own attendance report.",
      });
    }

    const dateRange = getPeriodRange(period, from, to);

    if (period === "custom" && !dateRange) {
      return res.status(400).json({
        message: "A valid custom start and end date are required.",
      });
    }

    const query = {
      lecturer: lecturerId,
    };

    if (dateRange) {
      query.scannedAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    const attendance = await Attendance.find(query)
      .populate(
        "student",
        "name email indexNumber department level className"
      )
      .populate("lecturer", "name email")
      .populate("course", "courseName courseCode")
      .populate(
        "session",
        "className department level date startTime endTime status"
      )
      .sort({ scannedAt: -1 });

    return res.status(200).json({
      attendance,
      period: period || "all",
      from: dateRange?.start || null,
      to: dateRange?.end || null,
    });
  } catch (error) {
    console.error(
      "Get lecturer attendance report error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch lecturer attendance report.",
      error: error.message,
    });
  }
};


// ============================================================
// GET SESSION ATTENDANCE
// ============================================================
export const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AttendanceSession.findById(sessionId)
      .populate("course", "courseName courseCode");

    if (!session) {
      return res.status(404).json({
        message: "Attendance session not found.",
      });
    }

    // Security: lecturer can only view their own session.
    if (
      req.user &&
      req.user.role === "lecturer" &&
      session.lecturer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You can only access your own attendance sessions.",
      });
    }

    const actualAttendance = await Attendance.find({
      session: session._id,
    })
      .populate(
        "student",
        "name email indexNumber department level className"
      )
      .sort({ scannedAt: 1 });

    const attendanceMap = new Map();

    actualAttendance.forEach((record) => {
      if (record.student?._id) {
        attendanceMap.set(
          record.student._id.toString(),
          record
        );
      }
    });

    const rosterStudents = await User.find({
      role: "student",
      department: session.department,
      level: session.level,
      className: session.className,
    }).select(
      "name email indexNumber department level className"
    );

    const completeAttendance = [];

    actualAttendance.forEach((record) => {
      completeAttendance.push({
        _id: record._id,
        student: record.student,
        lecturer: record.lecturer,
        course: record.course,
        session: record.session,
        status: record.status,
        studentLatitude: record.studentLatitude,
        studentLongitude: record.studentLongitude,
        studentAccuracy: record.studentAccuracy,
        distanceFromLecturer: record.distanceFromLecturer,
        locationVerified: record.locationVerified,
        scannedAt: record.scannedAt,
      });
    });

    rosterStudents.forEach((student) => {
      const studentId = student._id.toString();

      if (!attendanceMap.has(studentId)) {
        completeAttendance.push({
          _id: null,
          student,
          lecturer: session.lecturer,
          course: session.course,
          session: session._id,
          status: "Absent",
          studentLatitude: null,
          studentLongitude: null,
          studentAccuracy: null,
          distanceFromLecturer: null,
          locationVerified: false,
          scannedAt: null,
        });
      }
    });

    const total = completeAttendance.length;

    const present = completeAttendance.filter(
      (record) => record.status === "Present"
    ).length;

    const absent = completeAttendance.filter(
      (record) => record.status === "Absent"
    ).length;

    const attendanceRate =
      total > 0
        ? Number(((present / total) * 100).toFixed(2))
        : 0;

    return res.status(200).json({
      session,
      attendance: completeAttendance,
      summary: {
        total,
        present,
        absent,
        attendanceRate,
      },
    });
  } catch (error) {
    console.error(
      "Get session attendance error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch session attendance.",
      error: error.message,
    });
  }
};


// ============================================================
// GET ALL ATTENDANCE / ADMIN REPORT
// ============================================================
export const getAllAttendance = async (req, res) => {
  try {
    const { period, from, to } = req.query;

    const dateRange = getPeriodRange(period, from, to);

    if (period === "custom" && !dateRange) {
      return res.status(400).json({
        message: "A valid custom start and end date are required.",
      });
    }

    const query = {};

    if (dateRange) {
      query.scannedAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    const attendance = await Attendance.find(query)
      .populate(
        "student",
        "name email indexNumber department level className"
      )
      .populate("lecturer", "name email")
      .populate("course", "courseName courseCode")
      .populate(
        "session",
        "className department level startTime endTime status"
      )
      .sort({ scannedAt: -1 });

    return res.status(200).json({
      attendance,
      period: period || "all",
      from: dateRange?.start || null,
      to: dateRange?.end || null,
    });
  } catch (error) {
    console.error("Get all attendance error:", error);

    return res.status(500).json({
      message: "Failed to fetch attendance records.",
      error: error.message,
    });
  }
};
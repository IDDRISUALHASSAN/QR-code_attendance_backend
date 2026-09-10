import crypto from "crypto";

import AttendanceSession from "../models/AttendanceSession.js";
import CourseAssignment from "../models/CourseAssignment.js";

// ==========================================
// START ATTENDANCE SESSION
// ==========================================

export const startAttendanceSession = async (req, res) => {
  try {
    const {
      courseAssignmentId,
      duration = 15,
      lecturerLatitude,
      lecturerLongitude,
      lecturerAccuracy,
    } = req.body;

    // ==========================================
    // VALIDATE COURSE ASSIGNMENT
    // ==========================================

    if (!courseAssignmentId) {
      return res.status(400).json({
        message: "Course Assignment is required.",
      });
    }

    // ==========================================
    // VALIDATE LECTURER GPS
    // ==========================================

    if (
      lecturerLatitude === undefined ||
      lecturerLatitude === null ||
      lecturerLongitude === undefined ||
      lecturerLongitude === null
    ) {
      return res.status(400).json({
        message:
          "Lecturer location is required. Please allow location access and try again.",
      });
    }

    const latitude = Number(lecturerLatitude);
    const longitude = Number(lecturerLongitude);

    const accuracy =
      lecturerAccuracy !== undefined &&
      lecturerAccuracy !== null
        ? Number(lecturerAccuracy)
        : null;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        message: "Invalid lecturer GPS coordinates.",
      });
    }

    // ==========================================
    // VALID GPS RANGE
    // ==========================================

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        message: "Invalid lecturer latitude.",
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        message: "Invalid lecturer longitude.",
      });
    }

    // ==========================================
    // CHECK COURSE ASSIGNMENT
    // ==========================================

    const assignment = await CourseAssignment.findById(
      courseAssignmentId
    );

    if (!assignment) {
      return res.status(404).json({
        message: "Course Assignment not found.",
      });
    }

    // ==========================================
    // CHECK ACTIVE SESSION
    // ==========================================

    const activeSession = await AttendanceSession.findOne({
      courseAssignment: courseAssignmentId,
      status: "active",
    });

    if (activeSession) {
      // ==========================================
      // HANDLE OLD SESSION WITHOUT GPS
      // ==========================================

      if (
        activeSession.lecturerLatitude === undefined ||
        activeSession.lecturerLatitude === null ||
        activeSession.lecturerLongitude === undefined ||
        activeSession.lecturerLongitude === null
      ) {
        // Close the old session directly.
        // updateOne is used so Mongoose does not
        // validate the old missing GPS fields.
        await AttendanceSession.updateOne(
          { _id: activeSession._id },
          {
            $set: {
              status: "closed",
            },
          }
        );
      } else {
        // Existing valid GPS session
        return res.status(200).json({
          message: "Attendance session is already active.",
          session: activeSession,
        });
      }
    }

    // ==========================================
    // GENERATE QR TOKEN
    // ==========================================

    const qrToken = crypto.randomBytes(16).toString("hex");

    // ==========================================
    // SESSION TIME
    // ==========================================

    const startTime = new Date();

    const endTime = new Date(
      startTime.getTime() +
        Number(duration) * 60 * 1000
    );

    // ==========================================
    // CREATE SESSION
    // ==========================================

    const session = await AttendanceSession.create({
      courseAssignment: assignment._id,
      lecturer: assignment.lecturer,
      course: assignment.course,
      qrToken,

      // Lecturer GPS
      lecturerLatitude: latitude,
      lecturerLongitude: longitude,
      lecturerAccuracy: accuracy,

      startTime,
      endTime,
      status: "active",
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    res.status(201).json({
      message: "Attendance session started successfully.",
      session,
    });
  } catch (error) {
    console.error(
      "Start attendance session error:",
      error
    );

    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL ATTENDANCE SESSIONS
// ==========================================

export const getAttendanceSessions = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find()
      .populate({
        path: "lecturer",
        select: "name staffId",
      })
      .populate({
        path: "course",
        select: "courseName courseCode",
      })
      .populate({
        path: "courseAssignment",
        select: "academicYear semester",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      sessions,
    });
  } catch (error) {
    console.error(
      "Get attendance sessions error:",
      error
    );

    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

// ==========================================
// GET SESSION BY QR TOKEN
// ==========================================

export const getAttendanceSessionByToken = async (
  req,
  res
) => {
  try {
    const { qrToken } = req.params;

    if (!qrToken) {
      return res.status(400).json({
        message: "QR token is required.",
      });
    }

    // ==========================================
    // FIND SESSION
    // ==========================================

    const session = await AttendanceSession.findOne({
      qrToken,
    }).populate({
      path: "course",
      select: "courseName courseCode",
    });

    if (!session) {
      return res.status(404).json({
        message: "Invalid QR Code.",
      });
    }

    // ==========================================
    // CHECK SESSION STATUS
    // ==========================================

    if (session.status !== "active") {
      return res.status(400).json({
        message: "Attendance session is closed.",
      });
    }

    // ==========================================
    // CHECK LECTURER GPS
    // ==========================================

    if (
      session.lecturerLatitude === undefined ||
      session.lecturerLatitude === null ||
      session.lecturerLongitude === undefined ||
      session.lecturerLongitude === null
    ) {
      // This is an old session created before GPS
      // was added to the system.

      await AttendanceSession.updateOne(
        { _id: session._id },
        {
          $set: {
            status: "closed",
          },
        }
      );

      return res.status(400).json({
        message:
          "This attendance session does not have lecturer location data. Please ask the lecturer to start a new attendance session.",
      });
    }

    // ==========================================
    // CHECK EXPIRY
    // ==========================================

    if (new Date() > session.endTime) {
      // Use updateOne instead of session.save()
      // so old/legacy documents cannot trigger
      // GPS validation errors.
      await AttendanceSession.updateOne(
        { _id: session._id },
        {
          $set: {
            status: "closed",
          },
        }
      );

      return res.status(400).json({
        message: "QR Code has expired.",
      });
    }

    // ==========================================
    // RETURN SESSION
    // ==========================================

    res.status(200).json({
      session,
    });
  } catch (error) {
    console.error(
      "Get attendance session by token error:",
      error
    );

    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

// ==========================================
// CLOSE ATTENDANCE SESSION
// ==========================================

export const closeAttendanceSession = async (
  req,
  res
) => {
  try {
    const session = await AttendanceSession.findById(
      req.params.id
    );

    if (!session) {
      return res.status(404).json({
        message: "Attendance session not found.",
      });
    }

    // ==========================================
    // CLOSE SESSION DIRECTLY
    // ==========================================

    await AttendanceSession.updateOne(
      { _id: session._id },
      {
        $set: {
          status: "closed",
        },
      }
    );

    // Get updated session
    const updatedSession =
      await AttendanceSession.findById(session._id);

    res.status(200).json({
      message:
        "Attendance session closed successfully.",
      session: updatedSession,
    });
  } catch (error) {
    console.error(
      "Close attendance session error:",
      error
    );

    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};
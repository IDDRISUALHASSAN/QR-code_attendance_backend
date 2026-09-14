import express from "express";

import {
  scanAttendance,
  getStudentAttendance,
  getLecturerAttendanceSessions,
  getLecturerAttendanceReport,
  getSessionAttendance,
  getAllAttendance,
} from "../controllers/attendanceController.js";

import { protect } from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();


// ============================================================
// STUDENT
// ============================================================

// Scan attendance
router.post(
  "/scan",
  protect,
  authorizeRoles("student"),
  scanAttendance
);

// Student attendance history
router.get(
  "/student/:studentId",
  protect,
  authorizeRoles("student"),
  getStudentAttendance
);


// ============================================================
// LECTURER
// ============================================================

// Lecturer attendance sessions
router.get(
  "/lecturer/:lecturerId",
  protect,
  authorizeRoles("lecturer"),
  getLecturerAttendanceSessions
);

// Lecturer period-based attendance report
router.get(
  "/lecturer/:lecturerId/report",
  protect,
  authorizeRoles("lecturer"),
  getLecturerAttendanceReport
);

// Individual session attendance
router.get(
  "/session/:sessionId",
  protect,
  authorizeRoles("lecturer"),
  getSessionAttendance
);


// ============================================================
// ADMIN
// ============================================================

// Admin attendance report
router.get(
  "/report",
  protect,
  authorizeRoles("admin"),
  getAllAttendance
);


export default router;
import express from "express";

import {
  scanAttendance,
  getStudentAttendance,
  getLecturerAttendanceSessions,
  getSessionAttendance,
  getAllAttendance,
} from "../controllers/attendanceController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();


// Student scans QR
router.post(
  "/scan",
  protect,
  authorizeRoles("student"),
  scanAttendance
);


// Student views attendance history
router.get(
  "/student/:studentId",
  protect,
  authorizeRoles("student"),
  getStudentAttendance
);


// Lecturer views their attendance sessions
router.get(
  "/lecturer/:lecturerId",
  protect,
  authorizeRoles("lecturer"),
  getLecturerAttendanceSessions
);


// Lecturer views students who attended a session
router.get(
  "/session/:sessionId",
  protect,
  authorizeRoles("lecturer"),
  getSessionAttendance
);


// Admin views attendance report
router.get(
  "/report",
  protect,
  authorizeRoles("admin"),
  getAllAttendance
);


export default router;
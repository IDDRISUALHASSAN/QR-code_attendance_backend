import express from "express";

import {
  startAttendanceSession,
  getAttendanceSessions,
  getAttendanceSessionByToken,
  closeAttendanceSession,
} from "../controllers/attendanceSessionController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ==========================================
// START ATTENDANCE SESSION
// ==========================================

router.post(
  "/start",
  protect,
  authorizeRoles("lecturer"),
  startAttendanceSession
);

// ==========================================
// GET ALL ATTENDANCE SESSIONS
// ==========================================

router.get(
  "/",
  getAttendanceSessions
);

// ==========================================
// GET SESSION BY QR TOKEN
// ==========================================

router.get(
  "/token/:qrToken",
  protect,
  authorizeRoles("student"),
  getAttendanceSessionByToken
);

// ==========================================
// CLOSE ATTENDANCE SESSION
// ==========================================

router.put(
  "/close/:id",
  protect,
  authorizeRoles("lecturer"),
  closeAttendanceSession
);

export default router;
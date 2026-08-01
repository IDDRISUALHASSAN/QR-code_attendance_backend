import express from "express";

import {
  startAttendanceSession,
  getAttendanceSessions,
  closeAttendanceSession,
} from "../controllers/attendanceSessionController.js";

const router = express.Router();

// Start a new attendance session
router.post("/start", startAttendanceSession);

// Get all attendance sessions
router.get("/", getAttendanceSessions);

// Close an attendance session
router.put("/close/:id", closeAttendanceSession);

export default router;
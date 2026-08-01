import express from "express";
import { getStudentAttendance, scanAttendance, getLecturerAttendanceSessions } from "../controllers/attendanceController.js";


const router = express.Router();

router.post(
    "/scan",
    scanAttendance
);

router.get(
    "/student/:studentId",
    getStudentAttendance
);

router.get(
    "/lecturer/:lecturerId",
    getLecturerAttendanceSessions
);

export default router;
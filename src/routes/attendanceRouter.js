import express from "express";


import {scanAttendance, getStudentAttendance, getLecturerAttendanceSessions, getSessionAttendance, } from "../controllers/attendanceController.js";


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

router.get(
    "/session/:sessionId",
    getSessionAttendance
);


export default router;
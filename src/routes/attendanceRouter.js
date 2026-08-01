import express from "express";

import {
    scanAttendance,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post(
    "/scan",
    scanAttendance
);

export default router;
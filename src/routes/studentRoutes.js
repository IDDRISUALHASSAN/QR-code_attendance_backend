import express from "express";

import {
  getStudents,
  createStudent,
  organizeStudents,
} from "../controllers/studentController.js";

import { protect } from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// =========================================================
// ORGANIZE STUDENTS
// =========================================================

router.post(
  "/organize",
  protect,
  authorizeRoles("admin"),
  organizeStudents
);

// =========================================================
// GET ALL STUDENTS
// =========================================================

router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getStudents
);

// =========================================================
// CREATE STUDENT
// =========================================================

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createStudent
);

export default router;
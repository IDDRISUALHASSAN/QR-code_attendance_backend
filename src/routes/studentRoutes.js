import express from "express";

import {
  getStudents,
  createStudent,
  organizeStudents,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";

import { protect } from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/organize",
  protect,
  authorizeRoles("admin"),
  organizeStudents
);

router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getStudents
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateStudent
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteStudent
);

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createStudent
);

export default router;
import express from "express";

import {
  assignCourse,
  getAssignments,
  deleteAssignment,
} from "../controllers/courseAssignmentController.js";
import {getLecturerAssignments, } from "../controllers/courseAssignmentController.js";

const router = express.Router();

router.post("/", assignCourse);
router.get("/lecturer/:lecturerId", getLecturerAssignments);

router.get("/", getAssignments);

router.delete("/:id", deleteAssignment);

// get Assignmnet controllers





export default router;
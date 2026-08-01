import express from "express";

import {
  getUsers,
  getLecturers,
  getStudents,
  getAdmins,
  getUserById,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUsers);

router.get("/lecturers", getLecturers);

router.get("/students", getStudents);

router.get("/admins", getAdmins);

router.get("/:id", getUserById);

export default router;
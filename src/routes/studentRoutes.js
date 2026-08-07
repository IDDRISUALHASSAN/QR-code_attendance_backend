import express from "express";

import { getStudents } from "../controllers/studentController.js";
import { updateStudent, deleteStudent } from "../controllers/userController.js";



const router = express.Router();

router.get("/", getStudents);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;
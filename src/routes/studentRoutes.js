import express from "express";

import { getStudents } from "../controllers/studentController.js";
import { updateStudent, deleteStudent } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";



const router = express.Router();

router.get("/",protect, authorizeRoles("admin"), getStudents);
router.put("/:id", protect, authorizeRoles("admin"), updateStudent);
router.delete("/:id", protect, authorizeRoles("admin"), deleteStudent);

export default router;
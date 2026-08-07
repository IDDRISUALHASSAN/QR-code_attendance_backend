import express from "express";

import {
  getUsers,
  getLecturers,
  getStudents,
  getAdmins,
  getUserById,
  
} from "../controllers/userController.js";


const router = express.Router();


// Get all users
router.get("/", getUsers);


// Get all lecturers
router.get("/lecturers", getLecturers);


// Get all students
router.get("/students", getStudents);


// Get all admins
router.get("/admins", getAdmins);





// Get one user
router.get("/:id", getUserById);


export default router;
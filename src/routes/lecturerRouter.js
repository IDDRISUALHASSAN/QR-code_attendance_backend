import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getLecturers,
  updateLecturer,
  deleteLecturer,
} from "../controllers/lecturerController.js";


const router = express.Router();


router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getLecturers
);


router.put(
  "/:id",
  protect, 
  authorizeRoles("admin"),
  updateLecturer
);


router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteLecturer
);


export default router;
import express from "express";

import {
  getLecturers,
  updateLecturer,
  deleteLecturer,
} from "../controllers/lecturerController.js";


const router = express.Router();


router.get(
  "/",
  getLecturers
);


router.put(
  "/:id",
  updateLecturer
);


router.delete(
  "/:id",
  deleteLecturer
);


export default router;
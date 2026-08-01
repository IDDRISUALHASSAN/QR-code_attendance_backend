import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendOTP,
} from "../controllers/authController.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);

export default router;
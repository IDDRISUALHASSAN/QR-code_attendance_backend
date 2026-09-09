import express from "express";

import {
  registerUser,
  loginUser,
  verifyEmail,
  resendOTP,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  changePassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

// Logged-in user changes their own password
router.put("/change-password", protect, changePassword);

export default router;
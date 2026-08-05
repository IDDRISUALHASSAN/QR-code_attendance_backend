import express from "express";
import {registerUser,loginUser,verifyEmail, resendOTP,} from "../controllers/authController.js";
import { forgotPassword,} from "../controllers/authController.js";
import {verifyResetCode,} from "../controllers/authController.js";
import {resetPassword,} from "../controllers/authController.js";
const router = express.Router();


router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password",resetPassword);


export default router;
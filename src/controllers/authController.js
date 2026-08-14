import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import generateOTP from "../utils/generateOTP.js";
import { sendOTPEmail, sendPasswordResetEmail } from "../services/emailService.js";

// Temporary store for pending registrations
const pendingUsers = {};

// ======================= REGISTER =======================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, indexNumber, staffId, department, level } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    const validRoles = ["admin", "lecturer", "student"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    pendingUsers[email] = {
      name,
      email,
      password: hashedPassword,
      role,
      indexNumber: role === "student" ? indexNumber : null,
      staffId: role !== "student" ? staffId : null,
      department,
      level: role === "student" ? level : null,
      otp,
      otpExpiry,
    };

    await sendOTPEmail(email, otp);
    res.status(200).json({ message: "Verification code sent to your email. Please verify to complete registration." });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration", error: error.message });
  }
};

// ======================= VERIFY EMAIL =======================
// ======================= VERIFY EMAIL =======================

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Check required fields
    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required.",
      });
    }

    // Normalize email and OTP
    const normalizedEmail = email.trim().toLowerCase();
    const enteredOTP = String(otp).trim();

    // Find pending registration
    const pending = pendingUsers[normalizedEmail];

    if (!pending) {
      return res.status(404).json({
        message:
          "No pending registration found. Please register first.",
      });
    }

    // Check OTP expiry FIRST
    if (new Date() > pending.otpExpiry) {
      delete pendingUsers[normalizedEmail];

      return res.status(400).json({
        message:
          "Verification code has expired. Please register again.",
      });
    }

    // Normalize stored OTP
    const storedOTP = String(pending.otp).trim();

    // Check OTP
    if (enteredOTP !== storedOTP) {
      return res.status(400).json({
        message: "Invalid verification code.",
      });
    }

    // Make sure the email wasn't registered while pending
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      delete pendingUsers[normalizedEmail];

      return res.status(400).json({
        message: "An account with this email already exists.",
      });
    }

    // Create the verified user
    const user = await User.create({
      name: pending.name,
      email: normalizedEmail,
      password: pending.password,
      role: pending.role,
      indexNumber: pending.indexNumber,
      staffId: pending.staffId,
      department: pending.department,
      level: pending.level,
      isVerified: true,
    });

    // Remove temporary registration
    delete pendingUsers[normalizedEmail];

    return res.status(201).json({
      message:
        "Email verified successfully. Registration complete. You can now log in.",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Verify email error:", error);

    return res.status(500).json({
      message: "Server error during email verification.",
      error: error.message,
    });
  }
};
// ======================= RESEND OTP =======================
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const pending = pendingUsers[email];
    if (!pending) return res.status(404).json({ message: "No pending registration found. Please register first." });

    const otp = generateOTP();
    pending.otp = otp;
    pending.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await sendOTPEmail(email, otp);
    res.status(200).json({ message: "A new verification code has been sent." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ======================= LOGIN =======================
export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ message: "Email, password and role are required" });

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.role !== role) return res.status(403).json({ message: `This account is not registered as ${role}` });

    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: generateToken(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

// ======================= FORGOT PASSWORD =======================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with this email." });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = resetCode;
    user.resetPasswordCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(user.email, resetCode);
    res.status(200).json({ message: "Password reset code sent successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ======================= VERIFY RESET CODE =======================
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and code are required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.resetPasswordCode !== code) return res.status(400).json({ message: "Invalid reset code." });
    if (new Date() > user.resetPasswordCodeExpires) return res.status(400).json({ message: "Reset code has expired." });

    res.status(200).json({ message: "Reset code verified successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ======================= RESET PASSWORD =======================
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Email, code and new password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.resetPasswordCode !== code) return res.status(400).json({ message: "Invalid reset code." });
    if (new Date() > user.resetPasswordCodeExpires) return res.status(400).json({ message: "Reset code has expired." });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordCode = null;
    user.resetPasswordCodeExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

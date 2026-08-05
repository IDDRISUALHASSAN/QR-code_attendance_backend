import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import generateOTP from "../utils/generateOTP.js";
import { sendOTPEmail } from "../services/emailService.js";
import crypto from "crypto";
import nodemailer from "nodemailer";




// Temporary store for pending registrations
const pendingUsers = {};

// Register user - send OTP first, don't save yet
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      indexNumber,
      staffId,
      department,
      level,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password and role are required",
      });
    }

    const validRoles = ["admin", "lecturer", "student"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role selected",
      });
    }

    // Check if user already exists in database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Store user data temporarily (not in database yet)
    pendingUsers[email] = {
      name,
      email,
      password: hashedPassword,
      role,
      indexNumber: role === "student" ? indexNumber : null,
      staffId: role === "lecturer" || role === "admin" ? staffId : null,
      department,
      level: role === "student" ? level : null,
      otp,
      otpExpiry,
    };

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      message: "Verification code sent to your email. Please verify to complete registration.",
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
};


// Verify email - save user to database after OTP is confirmed
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required.",
      });
    }

    // Check if there is a pending registration
    const pending = pendingUsers[email];

    if (!pending) {
      return res.status(404).json({
        message: "No pending registration found. Please register first.",
      });
    }

    // Check if OTP matches
    if (pending.otp !== otp) {
      return res.status(400).json({
        message: "Invalid verification code.",
      });
    }

    // Check if OTP has expired
    if (new Date() > pending.otpExpiry) {
      delete pendingUsers[email];
      return res.status(400).json({
        message: "Verification code has expired. Please register again.",
      });
    }

    // Now save the user to the database
    const user = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      role: pending.role,
      indexNumber: pending.indexNumber,
      staffId: pending.staffId,
      department: pending.department,
      level: pending.level,
      isVerified: true,
    });

    // Remove from temporary store
    delete pendingUsers[email];

    res.status(201).json({
      message: "Email verified successfully. Registration complete. You can now log in.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if there is a pending registration
    const pending = pendingUsers[email];

    if (!pending) {
      return res.status(404).json({
        message: "No pending registration found. Please register first.",
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    pending.otp = otp;
    pending.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Send new OTP
    await sendOTPEmail(email, otp);

    res.status(200).json({
      message: "A new verification code has been sent.",
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password and role are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        message: `This account is not registered as ${role}`,
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user),
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
};

// forgotten password

export const forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {

            return res.status(400).json({
                message: "Email is required."
            });

        }

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(404).json({
                message: "No account found with this email."
            });

        }

        // Generate 6-digit code

        const resetCode = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        user.resetPasswordCode = resetCode;
        user.resetPasswordCodeExpires = new Date(
            Date.now() + 10 * 60 * 1000
        ); // 10 minutes

        await user.save();

        const transporter = nodemailer.createTransport({

            service: "gmail",

            auth: {

                user: process.env.EMAIL_USER,

                pass: process.env.EMAIL_PASS,

            },

        });

        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: user.email,

            subject: "QRAMS Password Reset",

            html: `
                <h2>Password Reset</h2>

                <p>Your password reset code is:</p>

                <h1>${resetCode}</h1>

                <p>This code expires in 10 minutes.</p>
            `,

        });

        res.status(200).json({

            message: "Password reset code sent successfully.",

        });

    }

    catch (error) {

        res.status(500).json({

            message: "Server Error",

            error: error.message,

        });

    }

};

// verify oTP
export const verifyResetCode = async (req, res) => {

    try {

        const { email, code } = req.body;

        if (!email || !code) {

            return res.status(400).json({
                message: "Email and code are required."
            });

        }

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(404).json({
                message: "User not found."
            });

        }

        if (user.resetPasswordCode !== code) {

            return res.status(400).json({
                message: "Invalid reset code."
            });

        }

        if (new Date() > user.resetPasswordCodeExpires) {

            return res.status(400).json({
                message: "Reset code has expired."
            });

        }

        res.status(200).json({
            message: "Reset code verified successfully."
        });

    } catch (error) {

        res.status(500).json({
            message: "Server Error",
            error: error.message,
        });

    }

};

export const resetPassword = async (req, res) => {

    try {

        const {
            email,
            code,
            newPassword,
        } = req.body;

        if (
            !email ||
            !code ||
            !newPassword
        ) {

            return res.status(400).json({

                message:
                    "Email, code and new password are required.",

            });

        }

        const user = await User.findOne({

            email,

        });

        if (!user) {

            return res.status(404).json({

                message:
                    "User not found.",

            });

        }

        if (
            user.resetPasswordCode !== code
        ) {

            return res.status(400).json({

                message:
                    "Invalid reset code.",

            });

        }

        if (
            new Date() >
            user.resetPasswordCodeExpires
        ) {

            return res.status(400).json({

                message:
                    "Reset code has expired.",

            });

        }

        const hashedPassword =
            await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;

        user.resetPasswordCode = null;
        user.resetPasswordCodeExpires = null;

        await user.save();

        res.status(200).json({

            message:
                "Password reset successfully.",

        });

    }

    catch (error) {

        res.status(500).json({

            message: "Server Error",

            error: error.message,

        });

    }

};
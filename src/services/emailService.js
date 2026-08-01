import nodemailer from "nodemailer";

// Log the email credentials to verify they are loaded correctly
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Not Loaded");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Attendance System Email Verification",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Email Verification</h2>
        <p>Welcome to the QR Attendance Management System.</p>
        <p>Your verification code is:</p>

        <h1 style="color:#007BFF;">${otp}</h1>

        <p>This code will expire in 10 minutes.</p>

        <p>If you did not create this account, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
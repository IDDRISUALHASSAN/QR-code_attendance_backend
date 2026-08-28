import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (email, subject, html) => {
  const mailOptions = {
    from: `"QR Attendance Management System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  };

try {
  const info = await transporter.sendMail(mailOptions);

  console.log("Email sent successfully:", info.messageId);

  return info;
} catch (error) {
  console.error("Nodemailer error:", error);
  console.error("Error code:", error.code);
  console.error("Error command:", error.command);
  console.error("Error response:", error.response);

  throw error;
}
  console.log("Email sent successfully:", info.messageId);

  return info;
};


// ======================= SEND OTP =======================

export const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: auto;
      padding: 30px;
      border: 1px solid #ddd;
      border-radius: 10px;
    ">

      <h2 style="color: #1f2937;">
        Email Verification
      </h2>

      <p>
        Welcome to the QR Attendance Management System.
      </p>

      <p>
        Your verification code is:
      </p>

      <h1 style="
        color: #007BFF;
        letter-spacing: 8px;
      ">
        ${otp}
      </h1>

      <p>
        This code will expire in 10 minutes.
      </p>

      <p>
        If you did not create this account,
        please ignore this email.
      </p>

      <hr />

      <p style="font-size: 12px; color: #777;">
        QR Attendance Management System<br>
        Kumasi Technical University
      </p>

    </div>
  `;

  return sendEmail(
    email,
    "Attendance System Email Verification",
    html
  );
};


// ======================= PASSWORD RESET =======================

export const sendPasswordResetEmail = async (
  email,
  resetCode
) => {

  const html = `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: auto;
      padding: 30px;
      border: 1px solid #ddd;
      border-radius: 10px;
    ">

      <h2>Password Reset</h2>

      <p>
        We received a request to reset your
        QR Attendance Management System password.
      </p>

      <p>
        Your password reset code is:
      </p>

      <h1 style="
        color: #007BFF;
        letter-spacing: 8px;
      ">
        ${resetCode}
      </h1>

      <p>
        This code expires in 10 minutes.
      </p>

      <p>
        If you did not request a password reset,
        you can safely ignore this email.
      </p>

    </div>
  `;

  return sendEmail(
    email,
    "QRAMS Password Reset",
    html
  );
};
import nodemailer from "nodemailer";

let transporter;

/**
 * Get or create the email transporter
 * Supports both SMTP and development mode (logs emails to console)
 */
function getTransporter() {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === "production") {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("Missing SMTP configuration in production");
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: use ethereal email for testing
    transporter = nodemailer.createTransport({
      host: "localhost",
      port: 1025,
      secure: false,
    });
  }

  return transporter;
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(email, resetUrl) {
  const transporter = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@retrogames.local",
    to: email,
    subject: "Reset Your Password",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">
          Reset Password
        </a>
      </p>
      <p>Or copy this link: <code>${resetUrl}</code></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Failed to send reset email");
  }
}

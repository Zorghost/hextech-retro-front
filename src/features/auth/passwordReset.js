"use server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/ratelimit";

const RESET_TOKEN_EXPIRY_HOURS = 1;

/**
 * Generate a secure random token for password reset
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Request a password reset by email
 */
export async function requestPasswordReset(email) {
  try {
    email = email.toLowerCase().trim();

    // Rate limiting: 3 password reset requests per email per 30 minutes
    const rateLimitResult = await checkRateLimit(`password-reset:${email}`, 3, 1800000);

    if (!rateLimitResult.success) {
      // Return generic message for security
      return { success: true, message: "If an account exists, a reset link has been sent." };
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return { success: true, message: "If an account exists, a reset link has been sent." };
    }

    // Delete old reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    // Generate new reset token
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token,
        email,
        expiresAt,
      },
    });

    // Build reset URL
    const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${siteUrl}/auth/reset-password?token=${token}`;

    // Send email
    await sendPasswordResetEmail(email, resetUrl);

    return { success: true, message: "If an account exists, a reset link has been sent." };
  } catch (error) {
    console.error("Password reset request failed:", error);
    return { success: false, message: "An error occurred. Please try again later." };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token, newPassword) {
  try {
    if (!token || !newPassword) {
      return { success: false, message: "Invalid request." };
    }

    if (newPassword.length < 8) {
      return { success: false, message: "Password must be at least 8 characters." };
    }

    // Find and validate reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { success: false, message: "Invalid or expired reset link." };
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      return { success: false, message: "Reset link has expired. Please request a new one." };
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Delete used token
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return { success: true, message: "Password reset successfully. You can now log in." };
  } catch (error) {
    console.error("Password reset failed:", error);
    return { success: false, message: "An error occurred. Please try again." };
  }
}

/**
 * Verify reset token exists and is valid
 */
export async function verifyResetToken(token) {
  try {
    if (!token) {
      return { valid: false };
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { valid: false };
    }

    if (new Date() > resetToken.expiresAt) {
      return { valid: false, expired: true };
    }

    return { valid: true, email: resetToken.email };
  } catch (error) {
    console.error("Token verification failed:", error);
    return { valid: false };
  }
}

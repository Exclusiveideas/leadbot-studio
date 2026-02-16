import { hashPassword } from "@/lib/auth/password";
import { generateResetToken, verifyToken } from "@/lib/auth/tokens";
import {
  resetPasswordRequestSchema,
  resetPasswordSchema,
} from "@/lib/auth/validation";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email/resend";
import {
  checkAuthRateLimit,
  getClientIp,
  buildRateLimitHeaders,
  formatRateLimitError,
} from "@/lib/middleware/authRateLimiter";
import { NextRequest, NextResponse } from "next/server";

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check rate limit (by IP only for reset requests to prevent enumeration)
    const clientIp = getClientIp(request.headers);
    const rateLimitResult = await checkAuthRateLimit(
      "resetPassword",
      clientIp,
      // Don't include email to prevent rate limit bypass via different emails
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: formatRateLimitError(rateLimitResult) },
        { status: 429, headers: buildRateLimitHeaders(rateLimitResult) },
      );
    }

    // Check if this is a reset request or actual reset
    if ("token" in body) {
      // Handle password reset
      const validatedData = resetPasswordSchema.parse(body);
      const { token, password } = validatedData;

      // Verify token
      let payload;
      try {
        payload = verifyToken(token);
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 400 },
        );
      }

      // Check token type
      if (payload.type !== "reset") {
        return NextResponse.json(
          { error: "Invalid token type" },
          { status: 400 },
        );
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || user.email !== payload.email) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
      }

      // Reject token if password was already changed after token was issued
      if (user.passwordChangedAt && payload.iat) {
        const tokenIssuedAt = new Date(payload.iat * 1000);
        if (tokenIssuedAt <= user.passwordChangedAt) {
          return NextResponse.json(
            { error: "This reset link has already been used" },
            { status: 400 },
          );
        }
      }

      // Hash new password
      const hashedPassword = await hashPassword(password);

      // Update password and invalidate all existing sessions for security
      await Promise.all([
        prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword, passwordChangedAt: new Date() },
        }),
        prisma.session.updateMany({
          where: { userId: user.id, isActive: true },
          data: { isActive: false },
        }),
      ]);

      return NextResponse.json({
        message: "Password reset successfully",
      });
    } else {
      // Handle reset request
      const validatedData = resetPasswordRequestSchema.parse(body);
      const { email } = validatedData;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Always return success to prevent email enumeration
      const response: any = {
        message:
          "If an account exists with this email, you will receive a password reset link",
      };

      if (user && user.isActive) {
        // Generate reset token
        const resetToken = generateResetToken(user.id, user.email);

        // Send password reset email
        try {
          await sendPasswordResetEmail(user.email, resetToken);
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);
          // Continue with response even if email fails
        }

        // Only include token in development mode for testing
        if (process.env.NODE_ENV === "development") {
          response.resetToken = resetToken;
        }
      }

      return NextResponse.json(response);
    }
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

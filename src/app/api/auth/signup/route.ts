import { hashPassword } from "@/lib/auth/password";
import { generateEmailVerificationToken } from "@/lib/auth/tokens";
import { signupSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email/resend";
import {
  checkAuthRateLimit,
  getClientIp,
  buildRateLimitHeaders,
  formatRateLimitError,
} from "@/lib/middleware/authRateLimiter";
import { logAuthEvent } from "@/lib/utils/audit";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = signupSchema.parse(body);
    const { email, password, name } = validatedData;

    // Check rate limit
    const clientIp = getClientIp(request.headers);
    const rateLimitResult = await checkAuthRateLimit("signup", clientIp, email);

    if (!rateLimitResult.allowed) {
      await logAuthEvent(
        "LOGIN_FAILED",
        undefined,
        { email, reason: "Signup rate limited", ip: clientIp },
        request,
      );
      return NextResponse.json(
        { error: formatRateLimitError(rateLimitResult) },
        { status: 429, headers: buildRateLimitHeaders(rateLimitResult) },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: nanoid(),
        email,
        name,
        password: hashedPassword,
        isActive: true,
        isVerified: false,
      },
    });

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken(
      user.id,
      user.email,
    );

    // Log signup event
    await logAuthEvent("SIGNUP", user.id, { email }, request);

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue with signup even if email fails
    }

    const response: any = {
      message:
        "Account created successfully. Please check your email to verify your account.",
      userId: user.id,
    };

    // Only include token in development mode for testing
    if (process.env.NODE_ENV === "development") {
      response.verificationToken = verificationToken;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

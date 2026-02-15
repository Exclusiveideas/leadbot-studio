import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth/tokens";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 },
      );
    }

    const payload = verifyToken(token);

    if (payload.type !== "email_verification") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({
        message: "Email already verified",
        alreadyVerified: true,
      });
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        isVerified: true,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({
      message: "Email verified successfully",
    });
  } catch (error: any) {
    if (error.message === "Invalid or expired token") {
      return NextResponse.json(
        { error: "Invalid or expired verification link" },
        { status: 400 },
      );
    }

    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { getSession } from "@/lib/auth/session";
import { generateInviteToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";
import { sendOrganizationInviteEmail } from "@/lib/email/resend";
import { notificationService } from "@/lib/services/notificationService";
import { sendInviteSchema } from "@/lib/validation/organization";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || !session?.organization?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        organizationRole: true,
        organizationId: true,
        organization: { select: { id: true, name: true } },
      },
    });

    if (!user || user.organizationRole !== "OWNER") {
      return NextResponse.json(
        { error: "Only organization owners can send invites" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = sendInviteSchema.parse(body);

    if (validated.email === user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot invite yourself" },
        { status: 400 },
      );
    }

    const existingMember = await prisma.user.findFirst({
      where: {
        email: validated.email,
        organizationId: user.organizationId,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "This person is already a member of your organization" },
        { status: 400 },
      );
    }

    const existingInvite = await prisma.organizationInvite.findFirst({
      where: {
        email: validated.email,
        organizationId: user.organizationId!,
        status: "PENDING",
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite has already been sent to this email" },
        { status: 400 },
      );
    }

    const token = generateInviteToken(
      user.organizationId!,
      validated.email,
      user.id,
    );

    const invite = await prisma.organizationInvite.create({
      data: {
        id: nanoid(),
        organizationId: user.organizationId!,
        email: validated.email,
        role: validated.role,
        token,
        invitedBy: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${token}`;

    try {
      await sendOrganizationInviteEmail(
        validated.email,
        user.organization!.name,
        user.name || user.email,
        inviteUrl,
      );
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      await prisma.organizationInvite.delete({ where: { id: invite.id } });
      return NextResponse.json(
        { error: "Failed to send invitation email. Please try again." },
        { status: 500 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
      select: { id: true },
    });

    if (existingUser) {
      await notificationService.notifyOrganizationInvitation(
        existingUser.id,
        user.organization!.name,
        user.name || user.email,
        token,
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Send invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId || !session?.organization?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const invites = await prisma.organizationInvite.findMany({
      where: {
        organizationId: user.organizationId,
        status: "PENDING",
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        inviter: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: invites });
  } catch (error) {
    console.error("List invites error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

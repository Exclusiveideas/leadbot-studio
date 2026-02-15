import { getSession } from "@/lib/auth/session";
import { generateInviteToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";
import { sendOrganizationInviteEmail } from "@/lib/email/resend";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        organizationId: true,
        organizationRole: true,
        organization: { select: { name: true } },
      },
    });

    if (!user || user.organizationRole !== "OWNER") {
      return NextResponse.json(
        { error: "Only organization owners can resend invites" },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    const invite = await prisma.organizationInvite.findUnique({
      where: { id },
    });

    if (!invite || invite.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 },
      );
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only resend pending invites" },
        { status: 400 },
      );
    }

    const newToken = generateInviteToken(
      user.organizationId!,
      invite.email,
      user.id,
    );

    await prisma.organizationInvite.update({
      where: { id },
      data: {
        token: newToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${newToken}`;

    await sendOrganizationInviteEmail(
      invite.email,
      user.organization!.name,
      user.name || user.email,
      inviteUrl,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

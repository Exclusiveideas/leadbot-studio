import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notificationService } from "@/lib/services/notificationService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 },
      );
    }

    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: {
        organization: { select: { id: true, name: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 400 },
      );
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: `This invite has already been ${invite.status.toLowerCase()}` },
        { status: 400 },
      );
    }

    if (invite.expiresAt < new Date()) {
      await prisma.organizationInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "This invite has expired. Please ask for a new one." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, organizationId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // Re-fetch user inside transaction for consistent read
      const currentUser = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { organizationId: true, organizationRole: true },
      });

      if (currentUser.organizationId === invite.organizationId) {
        throw new Error("ALREADY_MEMBER");
      }

      // Clean up old org if user is the sole member/owner and no chatbots exist
      if (currentUser.organizationId) {
        const [memberCount, ownerCount, chatbotCount] = await Promise.all([
          tx.user.count({
            where: { organizationId: currentUser.organizationId },
          }),
          tx.user.count({
            where: {
              organizationId: currentUser.organizationId,
              organizationRole: "OWNER",
            },
          }),
          tx.chatbot.count({
            where: { organizationId: currentUser.organizationId },
          }),
        ]);

        if (memberCount === 1 && ownerCount === 1 && chatbotCount === 0) {
          await tx.organization.delete({
            where: { id: currentUser.organizationId },
          });
        }
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          organizationId: invite.organizationId,
          organizationRole: invite.role,
        },
      });

      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });
    });

    try {
      await notificationService.createNotification({
        userId: invite.invitedBy,
        type: "INVITATION_ACCEPTED",
        title: "Invitation Accepted",
        message: `${user.name || user.email} has joined ${invite.organization.name}`,
        data: {
          organizationName: invite.organization.name,
          memberName: user.name || user.email,
          acceptedAt: new Date().toISOString(),
        },
      });
    } catch (notificationError) {
      console.error("Failed to send acceptance notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationId: invite.organizationId,
        organizationName: invite.organization.name,
      },
    });
  } catch (error: any) {
    if (error?.message === "ALREADY_MEMBER") {
      return NextResponse.json(
        { error: "You are already a member of this organization" },
        { status: 400 },
      );
    }
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
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
      select: { organizationId: true, organizationRole: true },
    });

    if (!user || user.organizationRole !== "OWNER") {
      return NextResponse.json(
        { error: "Only organization owners can revoke invites" },
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
        { error: "Can only revoke pending invites" },
        { status: 400 },
      );
    }

    await prisma.organizationInvite.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { updateMemberRoleSchema } from "@/lib/validation/organization";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true, organizationRole: true },
    });

    if (!currentUser || currentUser.organizationRole !== "OWNER") {
      return NextResponse.json(
        { error: "Only organization owners can update roles" },
        { status: 403 },
      );
    }

    const { id: memberId } = await context.params;
    const body = await request.json();
    const validated = updateMemberRoleSchema.parse(body);

    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: { id: true, organizationId: true, organizationRole: true },
    });

    if (!member || member.organizationId !== currentUser.organizationId) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 },
      );
    }

    if (member.organizationRole === "OWNER" && validated.role === "MEMBER") {
      const ownerCount = await prisma.user.count({
        where: {
          organizationId: currentUser.organizationId,
          organizationRole: "OWNER",
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last owner" },
          { status: 400 },
        );
      }
    }

    await prisma.user.update({
      where: { id: memberId },
      data: { organizationRole: validated.role },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Update member role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true, organizationRole: true },
    });

    if (!currentUser || currentUser.organizationRole !== "OWNER") {
      return NextResponse.json(
        { error: "Only organization owners can remove members" },
        { status: 403 },
      );
    }

    const { id: memberId } = await context.params;

    if (memberId === session.userId) {
      return NextResponse.json(
        { error: "You cannot remove yourself. Transfer ownership first." },
        { status: 400 },
      );
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, email: true, organizationId: true },
    });

    if (!member || member.organizationId !== currentUser.organizationId) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name: `${member.name || member.email}'s Workspace`,
          createdBy: member.id,
        },
      });

      await tx.user.update({
        where: { id: member.id },
        data: {
          organizationId: newOrg.id,
          organizationRole: "OWNER",
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

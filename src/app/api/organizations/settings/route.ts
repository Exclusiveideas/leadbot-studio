import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { updateOrgSettingsSchema } from "@/lib/validation/organization";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
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
        { error: "Only organization owners can update settings" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = updateOrgSettingsSchema.parse(body);

    const org = await prisma.organization.update({
      where: { id: user.organizationId! },
      data: validated,
      select: { id: true, name: true, subtitle: true, type: true, logoUrl: true },
    });

    return NextResponse.json({ success: true, data: org });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Update org settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

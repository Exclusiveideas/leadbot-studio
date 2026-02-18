import { NextResponse } from "next/server";
import { withRLS } from "@/lib/middleware/rls-wrapper";
import { createPortalSession } from "@/lib/services/stripeService";

export const POST = withRLS(
  async (_request, session, _rlsContext, _prisma) => {
    const organizationId = session.user.organization.id;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const result = await createPortalSession({
      organizationId,
      returnUrl: `${appUrl}/settings?tab=billing`,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { url: result.sessionUrl },
    });
  },
  { routeName: "POST /api/billing/portal" },
);

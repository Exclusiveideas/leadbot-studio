import { NextResponse } from "next/server";
import { withRLS } from "@/lib/middleware/rls-wrapper";
import { getSubscriptionDetails } from "@/lib/services/stripeService";

export const GET = withRLS(
  async (_request, session, _rlsContext, _prisma) => {
    const organizationId = session.user.organization.id;
    const details = await getSubscriptionDetails(organizationId);

    if (!details) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: details });
  },
  { routeName: "GET /api/billing/subscription" },
);

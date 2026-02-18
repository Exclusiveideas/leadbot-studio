import { NextResponse } from "next/server";
import { z } from "zod";
import { withRLS } from "@/lib/middleware/rls-wrapper";
import { createCheckoutSession } from "@/lib/services/stripeService";

const checkoutSchema = z.object({
  plan: z.enum(["BASIC", "PRO", "AGENCY"]),
  interval: z.enum(["monthly", "annual"]),
});

export const POST = withRLS(
  async (request, session, _rlsContext, _prisma) => {
    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { plan, interval } = validation.data;
    const organizationId = session.user.organization.id;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const result = await createCheckoutSession({
      organizationId,
      plan,
      interval,
      successUrl: `${appUrl}/settings?tab=billing&checkout=success`,
      cancelUrl: `${appUrl}/settings?tab=billing&checkout=canceled`,
      customerEmail: session.user.email,
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
  { routeName: "POST /api/billing/checkout" },
);

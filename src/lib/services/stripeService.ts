import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db";
import type { PlanTier } from "@/lib/constants/plans";
import { getPlanFromStripePriceId } from "@/lib/constants/plans";
import type { SubscriptionStatus } from "@prisma/client";

type CreateCheckoutSessionParams = {
  organizationId: string;
  plan: PlanTier;
  interval: "monthly" | "annual";
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
};

type CreateCheckoutSessionResult =
  | { success: true; sessionUrl: string }
  | { success: false; error: string };

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<CreateCheckoutSessionResult> {
  const {
    organizationId,
    plan,
    interval,
    successUrl,
    cancelUrl,
    customerEmail,
  } = params;

  if (plan === "FREE") {
    return { success: false, error: "FREE plan does not require payment" };
  }

  const { PLAN_CONFIG } = await import("@/lib/constants/plans");
  const { pricing } = PLAN_CONFIG[plan];
  const priceId =
    interval === "monthly"
      ? pricing.stripePriceMonthly
      : pricing.stripePriceAnnual;

  if (!priceId) {
    return {
      success: false,
      error: `No Stripe price configured for ${plan} ${interval}`,
    };
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { stripeCustomerId: true },
  });

  if (!org) {
    return { success: false, error: "Organization not found" };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: org.stripeCustomerId ?? undefined,
    customer_email: !org.stripeCustomerId ? customerEmail : undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 7,
      metadata: { organizationId, plan },
    },
    metadata: { organizationId, plan },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return { success: false, error: "Failed to create checkout session" };
  }

  return { success: true, sessionUrl: session.url };
}

type CreatePortalSessionParams = {
  organizationId: string;
  returnUrl: string;
};

type CreatePortalSessionResult =
  | { success: true; sessionUrl: string }
  | { success: false; error: string };

export async function createPortalSession(
  params: CreatePortalSessionParams,
): Promise<CreatePortalSessionResult> {
  const { organizationId, returnUrl } = params;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { stripeCustomerId: true },
  });

  if (!org?.stripeCustomerId) {
    return { success: false, error: "No billing account found" };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: returnUrl,
  });

  return { success: true, sessionUrl: session.url };
}

export async function syncSubscriptionFromStripe(
  subscriptionId: string,
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = subscription.customer as string;

  const org = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!org) {
    console.warn(`No organization found for Stripe customer ${customerId}`);
    return;
  }

  const plan = determinePlanFromSubscription(subscription);
  const status = mapStripeStatus(subscription.status);

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: status,
      plan,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
  });
}

type SubscriptionDetails = {
  plan: PlanTier;
  status: SubscriptionStatus | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: Date | null;
  isTrialing: boolean;
};

export async function getSubscriptionDetails(
  organizationId: string,
): Promise<SubscriptionDetails | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      plan: true,
      subscriptionStatus: true,
      cancelAtPeriodEnd: true,
      trialEndsAt: true,
    },
  });

  if (!org) return null;

  return {
    plan: (org.plan as PlanTier) ?? "BASIC",
    status: org.subscriptionStatus,
    cancelAtPeriodEnd: org.cancelAtPeriodEnd,
    trialEndsAt: org.trialEndsAt,
    isTrialing: org.subscriptionStatus === "TRIALING",
  };
}

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const organizationId = session.metadata?.organizationId;

  if (!organizationId) {
    console.warn("No organizationId in checkout session metadata");
    return;
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customerId },
  });

  if (subscriptionId) {
    await syncSubscriptionFromStripe(subscriptionId);
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId = subscription.customer as string;

  const org = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!org) return;

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      plan: "FREE",
      subscriptionStatus: "CANCELED",
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
    },
  });

  const unpublished = await prisma.chatbot.updateMany({
    where: { organizationId: org.id, status: "PUBLISHED" },
    data: { status: "DRAFT", publishedAt: null },
  });

  if (unpublished.count > 0) {
    const { notificationService } =
      await import("@/lib/services/notificationService");
    const users = await prisma.user.findMany({
      where: { organizationId: org.id },
      select: { id: true },
    });

    for (const user of users) {
      await notificationService.createNotification({
        userId: user.id,
        type: "SUBSCRIPTION_EXPIRED",
        title: "Subscription expired",
        message: `Your subscription has expired and ${unpublished.count} chatbot${unpublished.count > 1 ? "s have" : " has"} been unpublished. Upgrade to a paid plan to republish.`,
      });
    }
  }
}

function determinePlanFromSubscription(
  subscription: Stripe.Subscription,
): PlanTier {
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return "BASIC";
  return getPlanFromStripePriceId(priceId) ?? "BASIC";
}

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  const mapping: Record<string, SubscriptionStatus> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
    unpaid: "UNPAID",
    paused: "CANCELED",
  };
  return mapping[status] ?? "CANCELED";
}

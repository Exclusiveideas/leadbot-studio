import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
      appInfo: {
        name: "Leadbot Partners",
        version: "1.0.0",
      },
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as Record<string | symbol, unknown>)[prop];
  },
});

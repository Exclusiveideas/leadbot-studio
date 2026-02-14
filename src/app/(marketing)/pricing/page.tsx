import Link from "next/link";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Basic",
    price: "$20",
    description: "For solo practitioners getting started with AI lead capture",
    features: [
      "1 chatbot",
      "500 conversations/month",
      "Knowledge base (FAQs, documents, URLs)",
      "Dynamic lead capture forms",
      "Email notifications",
      "Calendly integration",
      "Basic analytics",
      "7 embed platforms supported",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Pro",
    price: "$50",
    description: "For growing practices that need more power and customization",
    features: [
      "3 chatbots",
      "Unlimited conversations",
      "All knowledge types (incl. YouTube)",
      "Booking wizard with categories",
      "Text request capture",
      "White-label (remove branding)",
      "Advanced analytics dashboard",
      "Conditional form logic",
      "Multi-step forms",
      "Priority email support",
    ],
    cta: "Get Started",
    featured: true,
  },
  {
    name: "Agency",
    price: "$150",
    description: "For agencies managing chatbots for multiple clients",
    features: [
      "10 chatbots",
      "Unlimited everything",
      "White-label branding",
      "Team management & sub-accounts",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "Priority support",
      "Custom onboarding",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <div className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            One new client pays for your entire year of LeadBotStudio. No
            hidden fees.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl p-8 ${
                tier.featured
                  ? "relative border-2 border-blue-600 bg-white shadow-lg"
                  : "border border-gray-200 bg-white"
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {tier.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{tier.description}</p>
              <div className="mt-6">
                <span className="text-5xl font-bold text-gray-900">
                  {tier.price}
                </span>
                <span className="text-gray-500">/month</span>
              </div>

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`mt-8 block rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                  tier.featured
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-gray-900">
                How does the free trial work?
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Start with our Basic plan free for 14 days. No credit card
                required. Set up your chatbot, see the leads come in, then
                decide.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Can I switch plans later?
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Yes! Upgrade or downgrade anytime. Your chatbots and data are
                preserved when you switch plans.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                What counts as a conversation?
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                A conversation is a chat session between a website visitor and
                your chatbot. Multiple messages in one session count as one
                conversation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Do you offer refunds?
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Yes, we offer a 30-day money-back guarantee. If you&apos;re not
                satisfied, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

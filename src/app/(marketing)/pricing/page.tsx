import Link from "next/link";
import { Check } from "lucide-react";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/marketing/motion";

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

const faqs = [
  {
    q: "How does the free trial work?",
    a: "Start with our Basic plan free for 14 days. No credit card required. Set up your chatbot, see the leads come in, then decide.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes! Upgrade or downgrade anytime. Your chatbots and data are preserved when you switch plans.",
  },
  {
    q: "What counts as a conversation?",
    a: "A conversation is a chat session between a website visitor and your chatbot. Multiple messages in one session count as one conversation.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
  },
];

export default function PricingPage() {
  return (
    <div className="px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <FadeInUp>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base text-brand-muted">
              One new client pays for your entire year of LeadBotStudio. No
              hidden fees.
            </p>
          </div>
        </FadeInUp>

        <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <StaggerItem key={tier.name}>
              <div
                className={`flex h-full flex-col rounded-2xl p-8 ${
                  tier.featured
                    ? "border-gradient relative shadow-lg shadow-brand-accent-from/10"
                    : "border border-brand-border bg-white"
                }`}
              >
                {tier.featured && (
                  <div className="bg-gradient-accent absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold text-brand-primary">
                    Most Popular
                  </div>
                )}
                <h2 className="text-xl font-semibold text-brand-primary">
                  {tier.name}
                </h2>
                <p className="mt-1 text-sm text-brand-muted">
                  {tier.description}
                </p>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-brand-primary">
                    {tier.price}
                  </span>
                  <span className="text-brand-muted">/month</span>
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent-to" />
                      <span className="text-sm text-brand-muted">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-8 block rounded-full py-3 text-center text-sm font-semibold transition-all ${
                    tier.featured
                      ? "bg-gradient-accent text-brand-primary hover:brightness-105"
                      : "border border-brand-border text-brand-primary hover:border-brand-muted hover:bg-brand-surface"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* FAQ */}
        <div className="mt-28">
          <FadeInUp>
            <h2 className="text-center text-2xl font-bold tracking-tight text-brand-primary sm:text-3xl">
              Frequently Asked Questions
            </h2>
          </FadeInUp>

          <StaggerContainer className="mx-auto mt-12 max-w-3xl grid gap-6 md:grid-cols-2">
            {faqs.map((faq) => (
              <StaggerItem key={faq.q}>
                <div className="rounded-2xl border border-brand-border bg-white p-6">
                  <h3 className="font-semibold text-brand-primary">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                    {faq.a}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </div>
  );
}

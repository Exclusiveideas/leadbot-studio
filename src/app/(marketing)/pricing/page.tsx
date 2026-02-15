"use client";

import Link from "next/link";
import { Check, ArrowRight, Minus } from "lucide-react";
import {
  ScrollReveal,
  StaggerReveal,
} from "@/components/marketing/gsap-animations";

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
    href: "/signup",
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
    href: "/signup",
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
    href: "/signup",
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

const comparisonFeatures = [
  { name: "Chatbots", basic: "1", pro: "3", agency: "10" },
  {
    name: "Conversations",
    basic: "500/mo",
    pro: "Unlimited",
    agency: "Unlimited",
  },
  { name: "Knowledge base", basic: true, pro: true, agency: true },
  { name: "YouTube training", basic: false, pro: true, agency: true },
  { name: "Lead capture forms", basic: true, pro: true, agency: true },
  { name: "Conditional form logic", basic: false, pro: true, agency: true },
  { name: "Booking wizard", basic: false, pro: true, agency: true },
  { name: "Calendly integration", basic: true, pro: true, agency: true },
  { name: "White-label", basic: false, pro: true, agency: true },
  {
    name: "Analytics dashboard",
    basic: "Basic",
    pro: "Advanced",
    agency: "Advanced",
  },
  { name: "Team management", basic: false, pro: false, agency: true },
  { name: "API access", basic: false, pro: false, agency: true },
  { name: "Priority support", basic: false, pro: true, agency: true },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-16 sm:pb-24 sm:pt-24 lg:px-8">
        <div className="bg-dot-grid absolute inset-0 opacity-30" />
        <div className="gradient-mesh absolute inset-0" />

        <div className="relative mx-auto max-w-3xl text-center">
          <ScrollReveal direction="up">
            <div className="accent-line mx-auto mb-6" />
            <h1 className="text-[clamp(2rem,4vw+0.5rem,3.5rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-brand-primary">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-[1.7] text-brand-muted">
              One new client pays for your entire year. No hidden fees, no
              surprises.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-20 lg:px-8">
        <StaggerReveal
          className="mx-auto grid max-w-5xl gap-5 sm:gap-6 md:grid-cols-3"
          childSelector=".stagger-item"
        >
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`stagger-item flex flex-col rounded-2xl p-7 sm:p-8 ${
                tier.featured
                  ? "border-gradient relative elevation-3"
                  : "elevation-1 border border-brand-border bg-white"
              }`}
            >
              {tier.featured && (
                <div className="bg-gradient-accent absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-semibold text-brand-primary sm:text-xs">
                  Most Popular
                </div>
              )}

              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.1em] ${
                    tier.featured ? "text-brand-accent-to" : "text-brand-light"
                  }`}
                >
                  {tier.name}
                </p>
                <div className="mt-3">
                  <span className="text-4xl font-extrabold tracking-tight text-brand-primary sm:text-5xl">
                    {tier.price}
                  </span>
                  <span className="text-sm text-brand-muted">/month</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  {tier.description}
                </p>
              </div>

              <ul className="mt-7 flex-1 space-y-2.5">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-brand-muted"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent-to" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                  tier.featured
                    ? "bg-gradient-accent text-brand-primary hover:brightness-105"
                    : "border border-brand-border text-brand-primary hover:bg-brand-surface"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </StaggerReveal>

        <ScrollReveal direction="up" delay={0.2}>
          <p className="mt-8 text-center text-sm text-brand-light">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </ScrollReveal>
      </section>

      {/* Comparison Table */}
      <section className="bg-brand-surface px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal direction="up">
            <div className="mb-12 text-center sm:mb-16">
              <div className="accent-line mx-auto mb-5" />
              <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold tracking-[-0.02em] text-brand-primary">
                Compare plans side by side
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.1}>
            <div className="elevation-2 overflow-hidden rounded-2xl border border-brand-border bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-surface/50">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-brand-light">
                        Feature
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.08em] text-brand-light">
                        Basic
                      </th>
                      <th className="px-4 py-4 text-center">
                        <span className="rounded-full bg-gradient-accent px-3 py-0.5 text-xs font-semibold text-brand-primary">
                          Pro
                        </span>
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.08em] text-brand-light">
                        Agency
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((feature, i) => (
                      <tr
                        key={feature.name}
                        className={i % 2 === 0 ? "" : "bg-brand-surface/30"}
                      >
                        <td className="px-5 py-3 font-medium text-brand-secondary">
                          {feature.name}
                        </td>
                        {(["basic", "pro", "agency"] as const).map((plan) => {
                          const val = feature[plan];
                          return (
                            <td key={plan} className="px-4 py-3 text-center">
                              {val === true ? (
                                <Check className="mx-auto h-4 w-4 text-brand-accent-to" />
                              ) : val === false ? (
                                <Minus className="mx-auto h-4 w-4 text-brand-border" />
                              ) : (
                                <span className="text-brand-muted">{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal direction="left" distance={40}>
            <div className="mb-12 sm:mb-16">
              <div className="accent-line mb-5" />
              <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold tracking-[-0.02em] text-brand-primary">
                Frequently asked questions
              </h2>
            </div>
          </ScrollReveal>

          <StaggerReveal className="space-y-4" childSelector=".stagger-item">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="stagger-item rounded-xl border border-brand-border bg-white p-6 elevation-1"
              >
                <h3 className="font-semibold tracking-tight text-brand-primary">
                  {faq.q}
                </h3>
                <p className="mt-2.5 text-sm leading-[1.7] text-brand-muted">
                  {faq.a}
                </p>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative overflow-hidden bg-brand-primary px-6 py-20 sm:py-28 lg:px-8">
        <div className="bg-dot-grid absolute inset-0 opacity-10" />
        <div
          className="glow-orb left-1/4 top-0 h-[300px] w-[300px]"
          style={{ background: "rgba(255, 215, 140, 0.1)" }}
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <ScrollReveal direction="up">
            <h2 className="text-[clamp(1.5rem,3vw+0.5rem,2.5rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
              Ready to start capturing leads?
            </h2>
            <p className="mt-4 text-base leading-[1.7] text-white/50">
              14-day free trial. No credit card required.
            </p>
            <Link
              href="/signup"
              className="bg-gradient-accent group mt-8 inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-semibold text-brand-primary shadow-[0_8px_30px_rgba(255,171,122,0.3)] transition-all hover:shadow-[0_12px_40px_rgba(255,171,122,0.4)] hover:brightness-105"
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="mt-6 text-xs text-white/25">
              LeadBotStudio is built by the team behind{" "}
              <a
                href="https://seira.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 underline underline-offset-2 transition-colors hover:text-white/60"
              >
                Seira AI
              </a>{" "}
              — AI-powered e-discovery for legal professionals.
            </p>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

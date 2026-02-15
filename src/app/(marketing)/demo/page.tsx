"use client";

import Link from "next/link";
import { Zap, Shield, Users, ArrowRight, Clock, Globe } from "lucide-react";
import {
  ScrollReveal,
  StaggerReveal,
} from "@/components/marketing/gsap-animations";
import { motion } from "framer-motion";

const DEMO_EMBED_CODE = process.env.NEXT_PUBLIC_DEMO_EMBED_CODE;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const highlights = [
  {
    icon: Zap,
    title: "5-Minute Setup",
    description:
      "Choose your industry, upload content, and embed. No coding required.",
    color: "bg-amber-50",
    iconColor: "text-amber-500",
  },
  {
    icon: Shield,
    title: "Industry-Specific",
    description:
      "Pre-built templates for law firms, coaches, therapists, real estate, and more.",
    color: "bg-blue-50",
    iconColor: "text-brand-blue",
  },
  {
    icon: Users,
    title: "Lead Capture Built-In",
    description:
      "Dynamic forms, booking wizard, and email notifications — all included.",
    color: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
];

const heroFade = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function DemoPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-4 pt-16 sm:pt-24 lg:px-8">
        <div className="bg-dot-grid absolute inset-0 opacity-30" />
        <div className="gradient-mesh absolute inset-0" />

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            variants={heroFade}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="accent-line mx-auto mb-6" />
          </motion.div>
          <motion.div
            variants={heroFade}
            initial="hidden"
            animate="visible"
            custom={0.1}
          >
            <h1 className="text-[clamp(2rem,4vw+0.5rem,3.5rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-brand-primary">
              See LeadBotStudio <span className="text-gradient">in action</span>
            </h1>
          </motion.div>
          <motion.div
            variants={heroFade}
            initial="hidden"
            animate="visible"
            custom={0.2}
          >
            <p className="mx-auto mt-5 max-w-lg text-lg leading-[1.7] text-brand-muted">
              Chat with our demo bot below. It&apos;s built with the same tools
              you&apos;ll use to build yours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Demo Widget */}
      <section className="px-6 pb-16 pt-10 sm:pb-24 lg:px-8">
        <motion.div
          variants={heroFade}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className="mx-auto max-w-4xl"
        >
          <div className="elevation-3 overflow-hidden rounded-2xl border border-brand-border bg-white">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-brand-border/60 bg-brand-surface px-5 py-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-300" />
              </div>
              <div className="mx-auto rounded-md bg-white px-8 py-1 text-[11px] text-brand-light">
                leadbotstudio.com/demo
              </div>
            </div>

            {DEMO_EMBED_CODE ? (
              <iframe
                src={`${APP_URL}/chatbot/${DEMO_EMBED_CODE}`}
                className="h-[600px] w-full border-0"
                title="LeadBotStudio Demo Chatbot"
                allow="clipboard-write"
              />
            ) : (
              <div className="flex min-h-[500px] items-center justify-center p-12 text-center">
                <div>
                  <div className="bg-gradient-accent mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
                    <svg
                      className="h-8 w-8 text-brand-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-brand-primary">
                    Demo Coming Soon
                  </h3>
                  <p className="mt-2 text-sm leading-[1.7] text-brand-muted">
                    Sign up for free and build your own chatbot in 5 minutes.
                  </p>
                  <Link
                    href="/signup"
                    className="bg-gradient-accent group mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-brand-primary transition-all hover:brightness-105"
                  >
                    Try It Free
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Highlights */}
      <section className="bg-brand-surface px-6 py-16 sm:py-24 lg:px-8">
        <StaggerReveal
          className="mx-auto grid max-w-4xl gap-6 sm:gap-8 md:grid-cols-3"
          childSelector=".stagger-item"
        >
          {highlights.map((item) => (
            <div key={item.title} className="stagger-item">
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}
              >
                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-brand-primary">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-[1.7] text-brand-muted">
                {item.description}
              </p>
            </div>
          ))}
        </StaggerReveal>
      </section>

      {/* How it compares */}
      <section className="px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal direction="left" distance={40}>
            <div className="mb-12 max-w-xl sm:mb-16">
              <div className="accent-line mb-5" />
              <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold tracking-[-0.02em] text-brand-primary">
                Why service professionals choose LeadBotStudio
              </h2>
            </div>
          </ScrollReveal>

          <StaggerReveal
            className="grid gap-4 sm:grid-cols-2"
            childSelector=".stagger-item"
          >
            {[
              {
                icon: Clock,
                title: "24/7 availability",
                desc: "Your chatbot never sleeps. Capture leads from night owls and early birds.",
              },
              {
                icon: Zap,
                title: "Instant responses",
                desc: "No more 'we'll get back to you.' Visitors get answers in seconds.",
              },
              {
                icon: Shield,
                title: "Industry guardrails",
                desc: "Built-in boundaries prevent your bot from giving advice it shouldn't.",
              },
              {
                icon: Globe,
                title: "Works everywhere",
                desc: "WordPress, Shopify, Wix, Squarespace, Webflow — one line of code.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="stagger-item flex gap-4 rounded-xl border border-brand-border bg-white p-5 elevation-1"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-surface">
                  <item.icon className="h-5 w-5 text-brand-muted" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight text-brand-primary">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-[1.7] text-brand-muted">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-brand-primary px-6 py-20 sm:py-28 lg:px-8">
        <div className="bg-dot-grid absolute inset-0 opacity-10" />
        <div
          className="glow-orb right-1/4 top-0 h-[300px] w-[300px]"
          style={{ background: "rgba(255, 215, 140, 0.1)" }}
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <ScrollReveal direction="up">
            <h2 className="text-[clamp(1.5rem,3vw+0.5rem,2.5rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
              Build your own in 5 minutes
            </h2>
            <p className="mt-4 text-base leading-[1.7] text-white/50">
              Free 14-day trial. No credit card required.
            </p>
            <Link
              href="/signup"
              className="bg-gradient-accent group mt-8 inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-semibold text-brand-primary shadow-[0_8px_30px_rgba(255,171,122,0.3)] transition-all hover:shadow-[0_12px_40px_rgba(255,171,122,0.4)] hover:brightness-105"
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

"use client";

import Link from "next/link";
import { Zap, Shield, Users, ArrowRight } from "lucide-react";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/marketing/motion";

const DEMO_EMBED_CODE = process.env.NEXT_PUBLIC_DEMO_EMBED_CODE;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const highlights = [
  {
    icon: Zap,
    title: "5-Minute Setup",
    description:
      "Choose your industry, upload content, and embed. No coding required.",
  },
  {
    icon: Shield,
    title: "Industry-Specific",
    description:
      "Pre-built templates for law firms, coaches, therapists, real estate, and more.",
  },
  {
    icon: Users,
    title: "Lead Capture Built-In",
    description:
      "Dynamic forms, booking wizard, and email notifications — all included.",
  },
];

export default function DemoPage() {
  return (
    <div className="px-6 py-28">
      <div className="mx-auto max-w-4xl">
        <FadeInUp>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl">
              See LeadBotStudio <span className="text-gradient">in Action</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base text-brand-muted">
              Chat with our demo bot below. It&apos;s built with
              LeadBotStudio&apos;s own platform — the same tools you&apos;ll use
              to build yours.
            </p>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.15}>
          <div className="mt-14 overflow-hidden rounded-2xl border border-brand-border bg-white shadow-xl shadow-brand-accent-from/5">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-brand-border bg-brand-surface px-5 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-300" />
              <div className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-xs text-brand-light">
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
                  <h3 className="mt-6 text-lg font-semibold text-brand-primary">
                    Demo Coming Soon
                  </h3>
                  <p className="mt-2 text-sm text-brand-muted">
                    Sign up for free and build your own chatbot in 5 minutes.
                  </p>
                  <Link
                    href="/signup"
                    className="bg-gradient-accent group mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-brand-primary transition-all hover:brightness-105"
                  >
                    Try It Free
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </FadeInUp>

        <StaggerContainer className="mt-16 grid gap-8 md:grid-cols-3">
          {highlights.map((item) => (
            <StaggerItem key={item.title}>
              <div className="text-center">
                <div className="bg-gradient-accent mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-brand-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-brand-primary">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  {item.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
}

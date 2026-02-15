"use client";

import Link from "next/link";
import {
  Scale,
  Target,
  Heart,
  Home,
  TrendingUp,
  MessageSquare,
  Users,
  Calendar,
  BarChart3,
  Code,
  ArrowRight,
  Check,
  Zap,
  Clock,
  Globe,
  FileText,
  Youtube,
  Link2,
  Sparkles,
  ExternalLink,
  Search,
  FolderOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ScrollReveal,
  StaggerReveal,
  AnimatedCounter,
  TextReveal,
} from "@/components/marketing/gsap-animations";

const heroFade = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const heroSlideLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: (delay: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const heroSlideRight = {
  hidden: { opacity: 0, x: 40 },
  visible: (delay: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const industries = [
  { name: "Law Firms", icon: Scale, href: "/niches/law-firm" },
  {
    name: "Business Coaches",
    icon: Target,
    href: "/niches/business-coach",
  },
  { name: "Therapists", icon: Heart, href: "/niches/therapist" },
  { name: "Real Estate", icon: Home, href: "/niches/real-estate" },
  {
    name: "Financial Advisors",
    icon: TrendingUp,
    href: "/niches/financial-advisor",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden pb-20 pt-12 sm:pb-32 sm:pt-24 lg:pt-32">
        {/* Background mesh */}
        <div className="gradient-mesh absolute inset-0" />
        <div className="bg-dot-grid absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            {/* Left — Copy */}
            <div>
              <motion.div
                variants={heroSlideLeft}
                initial="hidden"
                animate="visible"
                custom={0}
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-brand-accent-from/30 bg-brand-accent-from/10 px-3 py-1.5 text-xs font-medium text-brand-secondary">
                    <Zap className="h-3.5 w-3.5 text-brand-accent-to" />
                    AI chatbots for service professionals
                  </div>
                  <a
                    href="https://seira.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white/60 px-3 py-1.5 text-xs font-medium text-brand-muted transition-colors hover:border-brand-muted hover:text-brand-primary"
                  >
                    From the makers of Seira AI
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </motion.div>

              <motion.div
                variants={heroSlideLeft}
                initial="hidden"
                animate="visible"
                custom={0.1}
              >
                <h1 className="text-[clamp(2.25rem,5vw+0.5rem,4.5rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-brand-primary">
                  Turn your website
                  <br className="hidden sm:block" /> into a{" "}
                  <span className="text-gradient">lead machine</span>
                </h1>
              </motion.div>

              <motion.div
                variants={heroSlideLeft}
                initial="hidden"
                animate="visible"
                custom={0.2}
              >
                <p className="mt-6 max-w-lg text-lg leading-[1.7] text-brand-muted sm:text-xl">
                  Capture leads, answer questions, and book appointments
                  automatically — even while you sleep. Set up in 5 minutes, no
                  code required.
                </p>
              </motion.div>

              <motion.div
                variants={heroFade}
                initial="hidden"
                animate="visible"
                custom={0.3}
              >
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <Link
                    href="/signup"
                    className="bg-gradient-accent group inline-flex items-center justify-center gap-2.5 rounded-xl px-7 py-3.5 text-[15px] font-semibold text-brand-primary shadow-[0_8px_30px_rgba(255,171,122,0.25)] transition-all hover:shadow-[0_12px_40px_rgba(255,171,122,0.35)] hover:brightness-105"
                  >
                    Get started free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/demo"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border px-7 py-3.5 text-[15px] font-semibold text-brand-primary transition-colors hover:border-brand-muted hover:bg-brand-surface"
                  >
                    See it in action
                  </Link>
                </div>
              </motion.div>

              {/* Social proof row */}
              <motion.div
                variants={heroFade}
                initial="hidden"
                animate="visible"
                custom={0.4}
              >
                <div className="mt-10 flex items-center gap-3 text-[13px] text-brand-muted sm:text-sm">
                  <div className="flex shrink-0 -space-x-2">
                    {[
                      "https://i.pravatar.cc/80?img=32",
                      "https://i.pravatar.cc/80?img=47",
                      "https://i.pravatar.cc/80?img=44",
                      "https://i.pravatar.cc/80?img=12",
                    ].map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        width={30}
                        height={30}
                        className="h-[30px] w-[30px] rounded-full border-2 border-white object-cover sm:h-[34px] sm:w-[34px]"
                      />
                    ))}
                  </div>
                  <span>
                    Trusted by{" "}
                    <strong className="font-semibold text-brand-secondary">
                      2,000+
                    </strong>{" "}
                    professionals
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Right — Product mockup */}
            <motion.div
              variants={heroSlideRight}
              initial="hidden"
              animate="visible"
              custom={0.15}
            >
              <div className="relative">
                {/* Browser chrome */}
                <div className="elevation-3 overflow-hidden rounded-2xl border border-brand-border/80 bg-white">
                  {/* Title bar */}
                  <div className="flex items-center gap-2 border-b border-brand-border/60 bg-brand-surface px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-300" />
                    </div>
                    <div className="mx-auto rounded-md bg-white px-8 py-1 text-[11px] text-brand-light">
                      yourwebsite.com
                    </div>
                  </div>

                  {/* Fake page content */}
                  <div className="relative bg-gradient-to-b from-brand-surface to-white p-6 sm:p-8">
                    <div className="space-y-3">
                      <div className="h-3 w-3/4 rounded-full bg-brand-border/60" />
                      <div className="h-3 w-1/2 rounded-full bg-brand-border/40" />
                      <div className="h-3 w-2/3 rounded-full bg-brand-border/30" />
                      <div className="mt-6 h-24 w-full rounded-xl bg-brand-border/20" />
                    </div>

                    {/* Chatbot widget floating */}
                    <div className="absolute bottom-4 right-4 w-[260px] sm:w-[280px]">
                      <div className="elevation-3 rounded-2xl border border-brand-border/50 bg-white">
                        {/* Widget header */}
                        <div className="bg-gradient-accent flex items-center gap-2.5 rounded-t-2xl px-4 py-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/30">
                            <MessageSquare className="h-4 w-4 text-brand-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-brand-primary">
                              Mitchell Law
                            </p>
                            <p className="text-[10px] text-brand-primary/60">
                              Typically replies in seconds
                            </p>
                          </div>
                        </div>

                        {/* Chat messages */}
                        <div className="space-y-2.5 px-3 py-3">
                          <div className="max-w-[90%] rounded-xl rounded-tl-sm bg-brand-surface px-3 py-2 text-[11px] leading-relaxed text-brand-secondary">
                            Hi! I was in a car accident. Do I have a case?
                          </div>
                          <div className="ml-auto max-w-[90%] rounded-xl rounded-tr-sm bg-gradient-accent px-3 py-2 text-[11px] leading-relaxed text-brand-primary">
                            I&apos;m sorry to hear that. Were there any injuries
                            involved?
                          </div>
                          <div className="max-w-[90%] rounded-xl rounded-tl-sm bg-brand-surface px-3 py-2 text-[11px] leading-relaxed text-brand-secondary">
                            Yes, back pain since the accident.
                          </div>
                          <div className="ml-auto max-w-[90%] rounded-xl rounded-tr-sm bg-gradient-accent px-3 py-2 text-[11px] leading-relaxed text-brand-primary">
                            You may have grounds for a claim. Book a free
                            consultation?
                          </div>
                          <div className="ml-auto">
                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-[10px] font-medium text-white">
                              <Calendar className="h-2.5 w-2.5" /> Book
                              consultation
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating accent orb behind mockup */}
                <div
                  className="glow-orb -right-16 -top-16 h-[250px] w-[250px] sm:h-[350px] sm:w-[350px]"
                  style={{ background: "rgba(255, 215, 140, 0.2)" }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── INDUSTRY MARQUEE ─── */}
      <section className="border-y border-brand-border/50 py-4 sm:py-5">
        <div className="marquee-container">
          <div className="marquee-track" style={{ animationDuration: "40s" }}>
            {[...industries, ...industries, ...industries, ...industries].map(
              (ind, i) => (
                <Link
                  key={`${ind.name}-${i}`}
                  href={ind.href}
                  className="mx-2 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3.5 py-1.5 text-xs font-medium text-brand-primary transition-colors hover:border-brand-accent-from/50 hover:bg-brand-surface sm:mx-3 sm:gap-2 sm:px-5 sm:py-2 sm:text-sm"
                >
                  <ind.icon className="h-3.5 w-3.5 text-brand-muted" />
                  {ind.name}
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="px-6 py-16 sm:py-24 lg:px-8">
        <StaggerReveal
          className="mx-auto grid max-w-5xl grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-0"
          childSelector=".stagger-item"
        >
          {[
            { value: 2000, suffix: "+", label: "Businesses" },
            { value: 1, suffix: "M+", label: "Conversations" },
            { value: 5, suffix: " min", label: "Setup time" },
            { value: 24, suffix: "/7", label: "Always active" },
          ].map((stat, i) => (
            <div key={stat.label} className="stagger-item relative text-center">
              {i > 0 && (
                <div className="stat-divider absolute -left-px top-2 bottom-2 hidden lg:block" />
              )}
              <div className="text-3xl font-extrabold tracking-tight text-brand-primary sm:text-4xl lg:text-5xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-1.5 text-sm font-medium text-brand-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </StaggerReveal>
      </section>

      {/* ─── BENTO FEATURES GRID ─── */}
      <section className="relative px-6 py-16 sm:py-24 lg:px-8 lg:py-32">
        <div className="bg-dot-grid absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-7xl">
          <ScrollReveal direction="left" distance={40}>
            <div className="mb-12 max-w-2xl sm:mb-16">
              <div className="accent-line mb-5" />
              <h2 className="text-[clamp(1.75rem,3vw+0.5rem,3rem)] font-bold leading-[1.15] tracking-[-0.02em] text-brand-primary">
                Everything you need to convert visitors into clients
              </h2>
              <p className="mt-4 max-w-lg text-base leading-[1.7] text-brand-muted sm:text-lg">
                Not just a chatbot — a complete lead generation system built for
                service professionals.
              </p>
            </div>
          </ScrollReveal>

          {/* Bento Grid */}
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* CARD 1: AI Conversations — spans 2 rows on lg */}
            <ScrollReveal
              direction="up"
              delay={0}
              className="md:col-span-2 lg:col-span-1 lg:row-span-2"
            >
              <div className="bento-card elevation-2 flex h-full flex-col overflow-hidden rounded-2xl border border-brand-border bg-white">
                <div className="flex-1 p-6 sm:p-8">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent-from/15">
                    <MessageSquare className="h-5 w-5 text-brand-accent-to" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-brand-primary sm:text-2xl">
                    AI Conversations
                  </h3>
                  <p className="mt-2.5 text-sm leading-[1.7] text-brand-muted">
                    Natural language chatbot that understands context, answers
                    from your knowledge base, and qualifies leads — all in your
                    brand&apos;s voice.
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {[
                      "Trained on your content",
                      "Qualifies leads automatically",
                      "Works 24/7 — never sleeps",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-brand-muted"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent-to" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Chat preview */}
                <div className="border-t border-brand-border/50 bg-brand-surface/50 p-4 sm:p-5">
                  <div className="space-y-2">
                    <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-white px-3 py-2 text-xs text-brand-secondary shadow-sm">
                      Do you handle custody disputes?
                    </div>
                    <div className="ml-auto max-w-[80%] rounded-xl rounded-tr-sm bg-gradient-accent px-3 py-2 text-xs text-brand-primary shadow-sm">
                      Yes — we specialize in family law including custody. Would
                      you like to discuss your situation?
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* CARD 2: Lead Capture */}
            <ScrollReveal direction="up" delay={0.08}>
              <div className="bento-card elevation-2 overflow-hidden rounded-2xl border border-brand-border bg-white p-6 sm:p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Users className="h-5 w-5 text-brand-blue" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-brand-primary">
                  Smart Lead Capture
                </h3>
                <p className="mt-2.5 text-sm leading-[1.7] text-brand-muted">
                  Dynamic forms appear after the AI has built trust.
                  Conversation data auto-fills fields so visitors submit faster.
                </p>
                {/* Mini form mockup */}
                <div className="mt-5 rounded-xl border border-brand-border bg-brand-surface/70 p-3.5">
                  <div className="space-y-2">
                    <div className="rounded-lg bg-white px-3 py-2 text-[11px] text-brand-light">
                      Full name
                    </div>
                    <div className="rounded-lg border border-brand-accent-from/30 bg-brand-accent-from/5 px-3 py-2 text-[11px] font-medium text-brand-secondary">
                      sarah@email.com
                      <span className="ml-1 text-[9px] text-brand-accent-to">
                        auto-filled
                      </span>
                    </div>
                    <div className="bg-gradient-accent rounded-lg px-3 py-2 text-center text-[11px] font-semibold text-brand-primary">
                      Request Callback
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* CARD 3: Booking */}
            <ScrollReveal direction="up" delay={0.16}>
              <div className="bento-card elevation-2 overflow-hidden rounded-2xl border border-brand-border bg-white p-6 sm:p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-brand-primary">
                  Appointment Booking
                </h3>
                <p className="mt-2.5 text-sm leading-[1.7] text-brand-muted">
                  Visitors book directly from chat — no phone tag. Integrates
                  with Calendly or use our built-in booking wizard.
                </p>
                {/* Mini calendar */}
                <div className="mt-5 grid grid-cols-7 gap-1 rounded-xl border border-brand-border bg-brand-surface/70 p-3">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div
                      key={`day-${i}`}
                      className="text-center text-[9px] font-medium text-brand-light"
                    >
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: 28 }, (_, i) => (
                    <div
                      key={`date-${i}`}
                      className={`flex h-6 items-center justify-center rounded-md text-[10px] ${
                        i === 14
                          ? "bg-gradient-accent font-semibold text-brand-primary"
                          : i === 10 || i === 17 || i === 22
                            ? "bg-brand-accent-from/10 font-medium text-brand-secondary"
                            : "text-brand-light"
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* CARD 4: Analytics — wide card on bottom */}
            <ScrollReveal direction="up" delay={0.1} className="md:col-span-2">
              <div className="bento-card elevation-2 overflow-hidden rounded-2xl border border-brand-border bg-brand-primary p-6 text-white sm:p-8">
                <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
                  <div>
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <BarChart3 className="h-5 w-5 text-brand-accent-from" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                      Analytics that{" "}
                      <span className="text-gradient">drive decisions</span>
                    </h3>
                    <p className="mt-2.5 text-sm leading-[1.7] text-white/60">
                      Track conversations, leads, and conversion rates in real
                      time. Know what questions prospects ask most and optimize
                      your chatbot for more conversions.
                    </p>
                  </div>
                  {/* Chart mockup */}
                  <div className="flex items-end gap-1.5 rounded-xl bg-white/5 p-4 sm:gap-2 sm:p-5">
                    {[35, 45, 30, 60, 50, 75, 65, 80, 70, 90, 85, 95].map(
                      (h, i) => (
                        <div
                          key={`bar-${i}`}
                          className="flex-1 rounded-t bg-gradient-accent transition-all"
                          style={{
                            height: `${Math.round(h * 0.8)}px`,
                            opacity: 0.5 + (h / 95) * 0.5,
                          }}
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIAL ─── */}
      <section className="px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal direction="up">
            <div className="elevation-2 relative overflow-hidden rounded-2xl border border-brand-border bg-white p-8 sm:p-12">
              {/* Accent orb */}
              <div
                className="glow-orb -right-16 -top-16 h-[200px] w-[200px]"
                style={{ background: "rgba(255, 215, 140, 0.12)" }}
              />

              <div className="relative">
                <div className="accent-line mb-6" />
                <blockquote className="text-xl font-semibold leading-[1.5] tracking-tight text-brand-primary sm:text-2xl lg:text-3xl">
                  &ldquo;We went from 3 consultations per month to 15. The
                  chatbot qualifies leads before they even talk to us.&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-gradient-accent" />
                  <div>
                    <p className="text-sm font-semibold text-brand-primary">
                      Sarah Mitchell
                    </p>
                    <p className="text-sm text-brand-muted">
                      Managing Partner, Mitchell Family Law
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative bg-brand-surface px-6 py-20 sm:py-28 lg:px-8 lg:py-36">
        <div className="bg-dot-grid absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-6xl">
          <ScrollReveal direction="left" distance={40}>
            <div className="mb-14 max-w-xl sm:mb-20">
              <div className="accent-line mb-5" />
              <h2 className="text-[clamp(1.75rem,3vw+0.5rem,3rem)] font-bold leading-[1.15] tracking-[-0.02em] text-brand-primary">
                Go live in 5 minutes
              </h2>
              <p className="mt-4 text-base leading-[1.7] text-brand-muted sm:text-lg">
                No coding. No developers. No complexity.
              </p>
            </div>
          </ScrollReveal>

          <StaggerReveal
            className="grid gap-6 sm:gap-8 lg:grid-cols-3"
            childSelector=".stagger-item"
          >
            {/* Step 1 */}
            <div className="stagger-item group relative">
              <div className="mb-5 flex items-center gap-4">
                <div className="bg-gradient-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-brand-primary">
                  01
                </div>
                <div className="hidden h-px flex-1 bg-brand-border lg:block" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-brand-primary sm:text-xl">
                Choose your industry
              </h3>
              <p className="mt-2 text-sm leading-[1.7] text-brand-muted">
                Select from pre-built templates for law firms, coaches,
                therapists, real estate, and financial advisors — or build a
                custom bot from scratch.
              </p>
            </div>

            {/* Step 2 */}
            <div className="stagger-item group relative">
              <div className="mb-5 flex items-center gap-4">
                <div className="bg-gradient-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-brand-primary">
                  02
                </div>
                <div className="hidden h-px flex-1 bg-brand-border lg:block" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-brand-primary sm:text-xl">
                Add your content
              </h3>
              <p className="mt-2 text-sm leading-[1.7] text-brand-muted">
                Upload FAQs, documents, website URLs, or YouTube videos. Our AI
                learns your business instantly and speaks in your voice.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { icon: FileText, label: "Docs" },
                  { icon: Globe, label: "URLs" },
                  { icon: Youtube, label: "Video" },
                  { icon: Link2, label: "FAQs" },
                ].map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-white px-2.5 py-1 text-[11px] font-medium text-brand-muted"
                  >
                    <item.icon className="h-3 w-3" />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Step 3 */}
            <div className="stagger-item group relative">
              <div className="mb-5 flex items-center gap-4">
                <div className="bg-gradient-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-brand-primary">
                  03
                </div>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-brand-primary sm:text-xl">
                Embed & go live
              </h3>
              <p className="mt-2 text-sm leading-[1.7] text-brand-muted">
                Copy one line of code, paste it on your website, and start
                capturing leads 24/7.
              </p>
              {/* Code snippet mockup */}
              <div className="mt-4 rounded-lg border border-brand-border bg-brand-primary p-3">
                <code className="text-[11px] leading-relaxed text-brand-accent-from">
                  &lt;script src=&quot;leadbot.js&quot;
                  <br />
                  &nbsp;&nbsp;data-id=&quot;your-bot-id&quot;&gt;
                  <br />
                  &lt;/script&gt;
                </code>
              </div>
            </div>
          </StaggerReveal>
        </div>
      </section>

      {/* ─── EMBED PLATFORMS MARQUEE ─── */}
      <section className="border-y border-brand-border/50 py-4 sm:py-5">
        <div className="marquee-container">
          <div
            className="marquee-track-reverse"
            style={{ animationDuration: "50s" }}
          >
            {[
              "WordPress",
              "Shopify",
              "Wix",
              "Squarespace",
              "Webflow",
              "Next.js",
              "React",
              "HTML",
              "WordPress",
              "Shopify",
              "Wix",
              "Squarespace",
              "Webflow",
              "Next.js",
              "React",
              "HTML",
            ].map((platform, i) => (
              <span
                key={`${platform}-${i}`}
                className="mx-3 inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-brand-light sm:mx-4 sm:gap-2 sm:text-sm"
              >
                <Code className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {platform}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="px-6 py-20 sm:py-28 lg:px-8 lg:py-36">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal direction="left" distance={40}>
            <div className="mb-12 max-w-2xl sm:mb-16">
              <div className="accent-line mb-5" />
              <h2 className="text-[clamp(1.75rem,3vw+0.5rem,3rem)] font-bold leading-[1.15] tracking-[-0.02em] text-brand-primary">
                One new client pays for your{" "}
                <span className="text-gradient">entire year</span>
              </h2>
              <p className="mt-4 text-base leading-[1.7] text-brand-muted sm:text-lg">
                Plans that make sense for service professionals.
              </p>
            </div>
          </ScrollReveal>

          <StaggerReveal
            className="mx-auto flex max-w-4xl flex-col gap-5 sm:gap-6 lg:flex-row lg:items-start"
            childSelector=".stagger-item"
          >
            {/* Basic — hidden on mobile, shown on lg */}
            <div className="stagger-item hidden flex-1 flex-col rounded-2xl border border-brand-border bg-white p-6 lg:flex lg:p-7 elevation-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-light">
                Basic
              </p>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-brand-primary">
                  $20
                </span>
                <span className="text-sm text-brand-muted">/mo</span>
              </div>
              <p className="mt-2 text-xs text-brand-muted">
                Solo practitioners
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-xs text-brand-muted">
                {[
                  "1 chatbot",
                  "500 conversations/mo",
                  "Knowledge base & forms",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-6 block rounded-xl border border-brand-border py-2.5 text-center text-xs font-semibold text-brand-primary transition-all hover:bg-brand-surface"
              >
                Get Started
              </Link>
            </div>

            {/* Pro (featured) */}
            <div className="stagger-item border-gradient relative flex flex-col rounded-2xl p-6 elevation-3 sm:p-7 lg:flex-[1.5]">
              <div className="bg-gradient-accent absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-semibold text-brand-primary sm:text-xs">
                Most Popular
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent-to">
                Pro
              </p>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-brand-primary sm:text-4xl">
                  $50
                </span>
                <span className="text-sm text-brand-muted">/mo</span>
              </div>
              <p className="mt-2 text-xs text-brand-muted">Growing practices</p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-brand-muted">
                {[
                  "3 chatbots",
                  "Unlimited conversations",
                  "All knowledge types incl. YouTube",
                  "Booking wizard",
                  "White-label",
                  "Analytics dashboard",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-accent-to" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="bg-gradient-accent mt-6 block rounded-xl py-3 text-center text-sm font-semibold text-brand-primary transition-all hover:brightness-105"
              >
                Get Started
              </Link>
            </div>

            {/* Basic + Agency on mobile (side by side) */}
            <div className="stagger-item grid grid-cols-2 gap-4 lg:hidden">
              <div className="flex flex-col rounded-2xl border border-brand-border bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-light">
                  Basic
                </p>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold text-brand-primary">
                    $20
                  </span>
                  <span className="text-xs text-brand-muted">/mo</span>
                </div>
                <ul className="mt-3 flex-1 space-y-1.5 text-[11px] text-brand-muted">
                  {["1 chatbot", "500 convos/mo", "Knowledge base"].map(
                    (item) => (
                      <li key={item} className="flex gap-1.5">
                        <Check className="h-3 w-3 shrink-0 text-brand-accent-to" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
                <Link
                  href="/signup"
                  className="mt-4 block rounded-lg border border-brand-border py-1.5 text-center text-[11px] font-semibold text-brand-primary"
                >
                  Get Started
                </Link>
              </div>
              <div className="flex flex-col rounded-2xl border border-brand-border bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-light">
                  Agency
                </p>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold text-brand-primary">
                    $150
                  </span>
                  <span className="text-xs text-brand-muted">/mo</span>
                </div>
                <ul className="mt-3 flex-1 space-y-1.5 text-[11px] text-brand-muted">
                  {["10 chatbots", "Unlimited all", "Team & API"].map(
                    (item) => (
                      <li key={item} className="flex gap-1.5">
                        <Check className="h-3 w-3 shrink-0 text-brand-accent-to" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
                <Link
                  href="/signup"
                  className="mt-4 block rounded-lg border border-brand-border py-1.5 text-center text-[11px] font-semibold text-brand-primary"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Agency — hidden on mobile, shown on lg */}
            <div className="stagger-item hidden flex-1 flex-col rounded-2xl border border-brand-border bg-white p-6 lg:flex lg:p-7 elevation-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-light">
                Agency
              </p>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-brand-primary">
                  $150
                </span>
                <span className="text-sm text-brand-muted">/mo</span>
              </div>
              <p className="mt-2 text-xs text-brand-muted">Agencies & teams</p>
              <ul className="mt-5 flex-1 space-y-2 text-xs text-brand-muted">
                {[
                  "10 chatbots",
                  "Unlimited everything",
                  "Team management & API",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-6 block rounded-xl border border-brand-border py-2.5 text-center text-xs font-semibold text-brand-primary transition-all hover:bg-brand-surface"
              >
                Get Started
              </Link>
            </div>
          </StaggerReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <p className="mt-8 text-center text-sm text-brand-light sm:mt-10">
              All plans include a 14-day free trial. No credit card required.{" "}
              <Link
                href="/pricing"
                className="font-medium text-brand-accent-to underline underline-offset-2 transition-colors hover:text-brand-accent-from"
              >
                Compare all features
              </Link>
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── SECOND TESTIMONIAL ─── */}
      <section className="bg-brand-surface px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal direction="up">
            <div className="elevation-2 relative overflow-hidden rounded-2xl border border-brand-border bg-white p-8 sm:p-12">
              <div
                className="glow-orb -left-16 -bottom-16 h-[200px] w-[200px]"
                style={{ background: "rgba(55, 132, 255, 0.08)" }}
              />
              <div className="relative">
                <div className="accent-line mb-6" />
                <blockquote className="text-xl font-semibold leading-[1.5] tracking-tight text-brand-primary sm:text-2xl lg:text-3xl">
                  &ldquo;Setup took less than 10 minutes. The chatbot now
                  handles 80% of the questions we used to answer
                  manually.&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary">
                    <span className="text-sm font-semibold text-white">JO</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-primary">
                      Dr. James Okafor
                    </p>
                    <p className="text-sm text-brand-muted">
                      Okafor Financial Planning
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── SEIRA AI BRIDGE ─── */}
      <section className="relative overflow-hidden bg-brand-primary px-6 py-20 sm:py-28 lg:px-8">
        <div className="bg-dot-grid absolute inset-0 opacity-10" />
        <div
          className="glow-orb -left-20 top-1/2 h-[300px] w-[300px]"
          style={{ background: "rgba(255, 215, 140, 0.08)" }}
        />
        <div
          className="glow-orb -right-20 top-0 h-[250px] w-[250px]"
          style={{ background: "rgba(55, 132, 255, 0.06)" }}
        />

        <div className="relative mx-auto max-w-5xl">
          <ScrollReveal direction="up">
            <div className="mb-12 text-center sm:mb-16">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white/50">
                FROM THE MAKERS OF SEIRA AI
              </div>
              <h2 className="text-[clamp(1.75rem,3vw+0.5rem,3rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
                Capture leads.{" "}
                <span className="text-gradient">Then manage the cases.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-[1.7] text-white/45 sm:text-lg">
                LeadBotStudio brings clients to your door. Seira AI helps you
                serve them — with AI-powered document processing, case
                management, and e-discovery built for legal professionals.
              </p>
            </div>
          </ScrollReveal>

          <StaggerReveal
            className="grid gap-5 sm:gap-6 md:grid-cols-2"
            childSelector=".stagger-item"
          >
            {/* LeadBotStudio card */}
            <div className="stagger-item rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent">
                <MessageSquare className="h-5 w-5 text-brand-primary" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-accent-from">
                LeadBotStudio
              </p>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
                Get clients
              </h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  "AI chatbots that qualify leads 24/7",
                  "Smart lead capture forms",
                  "Appointment booking built in",
                  "Works on any website platform",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-white/50"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent-to" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Seira AI card */}
            <div className="stagger-item rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-6 backdrop-blur-sm sm:p-8">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/20">
                <Search className="h-5 w-5 text-brand-blue" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-blue">
                Seira AI
              </p>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
                Serve clients
              </h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  "AI document processing — 10x faster",
                  "Intelligent case management",
                  "Semantic search across all documents",
                  "Enterprise security & compliance",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-white/50"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </StaggerReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <div className="mt-10 text-center">
              <a
                href="https://seira.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:border-white/25 hover:bg-white/10"
              >
                Explore Seira AI
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative overflow-hidden bg-brand-surface px-6 py-24 sm:py-36 lg:px-8">
        {/* Background effects */}
        <div className="bg-dot-grid absolute inset-0 opacity-30" />

        <div className="relative mx-auto max-w-3xl text-center">
          <ScrollReveal direction="up">
            <h2 className="text-[clamp(1.75rem,4vw+0.5rem,3.5rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-brand-primary">
              Stop losing leads.
              <br />
              <span className="text-gradient">Start converting.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <p className="mx-auto mt-6 max-w-md text-lg leading-[1.7] text-brand-muted">
              Your competitors are already using AI chatbots. Every day without
              one is leads lost.
            </p>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="bg-gradient-accent group inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-semibold text-brand-primary shadow-[0_8px_30px_rgba(255,171,122,0.25)] transition-all hover:shadow-[0_12px_40px_rgba(255,171,122,0.35)] hover:brightness-105"
              >
                Build your chatbot — free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-muted underline underline-offset-4 transition-colors hover:text-brand-primary"
              >
                Or see a live demo first
              </Link>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.3}>
            <p className="mt-6 text-xs text-brand-light">
              Free 14-day trial. No credit card required.
            </p>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

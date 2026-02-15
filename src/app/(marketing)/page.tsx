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
  Zap,
  ArrowRight,
  Check,
  Quote,
} from "lucide-react";
import {
  FadeInUp,
  FadeInOnly,
  ScaleIn,
} from "@/components/marketing/motion";

const industries = [
  { name: "Law Firms", icon: Scale, href: "/niches/law-firm" },
  { name: "Business Coaches", icon: Target, href: "/niches/business-coach" },
  { name: "Therapists", icon: Heart, href: "/niches/therapist" },
  { name: "Real Estate", icon: Home, href: "/niches/real-estate" },
  { name: "Financial Advisors", icon: TrendingUp, href: "/niches/financial-advisor" },
];

export default function HomePage() {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden px-6 pb-28 pt-20 sm:pt-28">
        {/* Glow orbs */}
        <div
          className="glow-orb -left-20 -top-20 h-[600px] w-[600px]"
          style={{ background: "rgba(255, 215, 140, 0.22)" }}
        />
        <div
          className="glow-orb -right-20 top-32 h-[500px] w-[500px]"
          style={{ background: "rgba(255, 171, 122, 0.16)" }}
        />

        <div className="relative mx-auto max-w-4xl">
          <FadeInUp>
            <p className="text-center text-sm font-medium tracking-wide text-brand-muted">
              AI chatbots for service professionals
            </p>
          </FadeInUp>

          <FadeInUp delay={0.08}>
            <h1 className="mt-5 text-center text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.06] tracking-tight text-brand-primary">
              The AI notepad that turns
              <br className="hidden sm:block" />{" "}
              your website into a{" "}
              <span className="decorated-underline">lead machine</span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.16}>
            <p className="mx-auto mt-7 max-w-xl text-center text-lg leading-relaxed text-brand-muted">
              Capture leads, answer questions, and book appointments
              automatically — even while you sleep. Set up in 5 minutes.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.24}>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="bg-gradient-accent group inline-flex items-center gap-2 rounded-full px-7 py-3 text-[15px] font-semibold text-brand-primary shadow-lg shadow-brand-accent-from/20 transition-all hover:shadow-xl hover:shadow-brand-accent-from/30 hover:brightness-105"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/demo"
                className="rounded-full border border-brand-border px-7 py-3 text-[15px] font-semibold text-brand-primary transition-all hover:border-brand-muted hover:bg-brand-surface"
              >
                See it in action
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ─── INDUSTRY MARQUEE ─── */}
      <section className="border-y border-brand-border/50 py-5">
        <div className="marquee-container">
          <div className="marquee-track" style={{ animationDuration: "40s" }}>
            {[...industries, ...industries, ...industries, ...industries].map(
              (ind, i) => (
                <Link
                  key={`${ind.name}-${i}`}
                  href={ind.href}
                  className="mx-3 inline-flex shrink-0 items-center gap-2 rounded-full border border-brand-border bg-white px-5 py-2 text-sm font-medium text-brand-primary transition-colors hover:border-brand-accent-from/50 hover:bg-brand-surface"
                >
                  <ind.icon className="h-4 w-4 text-brand-muted" />
                  {ind.name}
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ─── FEATURE 1: AI Conversations — Asymmetric 2-col ─── */}
      <section className="px-6 py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <FadeInUp>
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-muted">
                <MessageSquare className="h-3.5 w-3.5" />
                Conversations
              </div>
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-primary sm:text-4xl">
                Your AI talks to visitors so you don&apos;t have to
              </h2>
              <p className="mt-5 text-base leading-relaxed text-brand-muted">
                Natural language chatbot that understands context, answers
                questions from your knowledge base, and qualifies leads —
                all in your brand&apos;s voice.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2.5 text-sm text-brand-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent-to" />
                  Trained on your content — FAQs, docs, URLs, videos
                </li>
                <li className="flex items-start gap-2.5 text-sm text-brand-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent-to" />
                  Qualifies leads before they reach your inbox
                </li>
                <li className="flex items-start gap-2.5 text-sm text-brand-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent-to" />
                  Works 24/7 — nights, weekends, holidays
                </li>
              </ul>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.15}>
            <div className="feature-visual aspect-[4/3] w-full p-8 lg:p-12">
              {/* Chat mockup */}
              <div className="flex flex-col gap-3">
                <div className="self-start rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm text-brand-secondary shadow-sm">
                  Hi! I was in a car accident last week. Do I have a case?
                </div>
                <div className="self-end rounded-2xl rounded-tr-sm bg-gradient-accent px-4 py-2.5 text-sm text-brand-primary shadow-sm max-w-[80%]">
                  I&apos;m sorry to hear that. I can help you understand your options. Were there any injuries involved?
                </div>
                <div className="self-start rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm text-brand-secondary shadow-sm">
                  Yes, I&apos;ve been having back pain since the accident.
                </div>
                <div className="self-end rounded-2xl rounded-tr-sm bg-gradient-accent px-4 py-2.5 text-sm text-brand-primary shadow-sm max-w-[80%]">
                  Based on what you&apos;ve described, you may have grounds for a personal injury claim. Would you like to schedule a free consultation with our attorney?
                </div>
                <div className="mt-1 self-end">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary px-4 py-1.5 text-xs font-medium text-white">
                    <Calendar className="h-3 w-3" /> Book consultation
                  </div>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ─── INLINE TESTIMONIAL ─── */}
      <section className="border-y border-brand-border/50 px-6 py-16">
        <FadeInOnly>
          <div className="mx-auto max-w-3xl text-center">
            <Quote className="mx-auto h-8 w-8 text-brand-accent-from opacity-50" />
            <blockquote className="mt-4 text-xl font-medium leading-relaxed text-brand-primary sm:text-2xl">
              &ldquo;We went from 3 consultations per month to 15. The chatbot
              qualifies leads before they even talk to us.&rdquo;
            </blockquote>
            <div className="mt-5 text-sm text-brand-muted">
              <span className="font-semibold text-brand-secondary">Sarah Mitchell</span>
              {" "}— Managing Partner, Mitchell Family Law
            </div>
          </div>
        </FadeInOnly>
      </section>

      {/* ─── FEATURE 2: Lead Capture — Reversed layout ─── */}
      <section className="px-6 py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <FadeInUp>
            <div className="feature-visual aspect-[4/3] w-full p-8 lg:p-12 order-2 lg:order-1">
              {/* Lead form mockup */}
              <div className="mx-auto max-w-sm rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-brand-primary">
                  Almost there — let us know how to reach you
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-muted">
                    Full name
                  </div>
                  <div className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-muted">
                    Email address
                  </div>
                  <div className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-muted">
                    Phone number
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg border border-brand-accent-from/50 bg-brand-accent-from/10 px-3 py-2 text-center text-xs font-medium text-brand-primary">
                      Urgent
                    </div>
                    <div className="flex-1 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-center text-xs text-brand-muted">
                      Not urgent
                    </div>
                  </div>
                  <div className="bg-gradient-accent rounded-lg px-3 py-2 text-center text-xs font-semibold text-brand-primary">
                    Request Callback
                  </div>
                </div>
                <p className="mt-3 text-center text-[10px] text-brand-light">
                  AI pre-filled 2 of 3 fields from conversation
                </p>
              </div>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.15}>
            <div className="order-1 lg:order-2">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-muted">
                <Users className="h-3.5 w-3.5" />
                Lead capture
              </div>
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-primary sm:text-4xl">
                Capture leads without breaking the conversation
              </h2>
              <p className="mt-5 text-base leading-relaxed text-brand-muted">
                Dynamic forms appear at the right moment — after the AI has
                built trust and qualified intent. Information from the
                conversation auto-fills fields so visitors submit faster.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2.5 text-sm text-brand-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent-to" />
                  Conditional logic — different fields for different needs
                </li>
                <li className="flex items-start gap-2.5 text-sm text-brand-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent-to" />
                  AI pre-fills fields from conversation context
                </li>
                <li className="flex items-start gap-2.5 text-sm text-brand-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent-to" />
                  Instant email notifications for your team
                </li>
              </ul>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ─── FEATURE 3: Booking + Analytics — stacked showcase ─── */}
      <section className="bg-brand-primary px-6 py-28 text-white">
        <div className="mx-auto max-w-6xl">
          <FadeInUp>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Book appointments.{" "}
                <span className="text-gradient">Track everything.</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/60">
                Calendly integration, built-in booking wizard, and a real-time
                analytics dashboard — see exactly how your chatbot performs.
              </p>
            </div>
          </FadeInUp>

          {/* Two capabilities side by side in asymmetric cards */}
          <div className="mt-16 grid gap-6 lg:grid-cols-2">
            <FadeInUp delay={0.1}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <Calendar className="h-8 w-8 text-brand-accent-from" />
                <h3 className="mt-4 text-xl font-semibold">
                  Appointment Booking
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  Visitors book directly from the chat — no phone tag, no
                  back-and-forth emails. Integrates with Calendly or use our
                  built-in booking wizard with categories, time slots, and
                  confirmations.
                </p>
                {/* Mini calendar mockup */}
                <div className="mt-6 grid grid-cols-7 gap-1 rounded-xl bg-white/5 p-4">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div
                      key={`day-${i}`}
                      className="text-center text-[10px] font-medium text-white/30"
                    >
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: 28 }, (_, i) => (
                    <div
                      key={`date-${i}`}
                      className={`flex h-7 items-center justify-center rounded-md text-xs ${
                        i === 14
                          ? "bg-gradient-accent font-semibold text-brand-primary"
                          : i === 10 || i === 17 || i === 22
                            ? "bg-white/10 text-white/70"
                            : "text-white/30"
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <BarChart3 className="h-8 w-8 text-brand-accent-from" />
                <h3 className="mt-4 text-xl font-semibold">
                  Analytics Dashboard
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  Track conversations, leads, and conversion rates in real time.
                  Know what questions prospects ask most and optimize your
                  chatbot for better results.
                </p>
                {/* Mini chart mockup */}
                <div className="mt-6 flex items-end gap-2 rounded-xl bg-white/5 p-4">
                  {[35, 45, 30, 60, 50, 75, 65, 80, 70, 90, 85, 95].map(
                    (h, i) => (
                      <div
                        key={`bar-${i}`}
                        className="flex-1 rounded-t-sm bg-gradient-accent opacity-70"
                        style={{ height: `${h}px` }}
                      />
                    ),
                  )}
                </div>
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS — Vertical timeline, not grid ─── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-3xl">
          <FadeInUp>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-brand-primary sm:text-4xl">
                Go live in 5 minutes
              </h2>
              <p className="mt-4 text-base text-brand-muted">
                No coding. No developers. No complexity.
              </p>
            </div>
          </FadeInUp>

          <div className="relative mt-16">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-brand-border sm:left-8" />

            {/* Step 1 */}
            <FadeInUp>
              <div className="relative mb-14 pl-16 sm:pl-20">
                <div className="bg-gradient-accent absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-brand-primary sm:h-16 sm:w-16 sm:text-base">
                  01
                </div>
                <h3 className="text-xl font-semibold text-brand-primary">
                  Choose your industry
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  Select from pre-built templates for law firms, coaches,
                  therapists, real estate, financial advisors — or create a
                  fully custom bot from scratch.
                </p>
              </div>
            </FadeInUp>

            {/* Step 2 */}
            <FadeInUp delay={0.1}>
              <div className="relative mb-14 pl-16 sm:pl-20">
                <div className="bg-gradient-accent absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-brand-primary sm:h-16 sm:w-16 sm:text-base">
                  02
                </div>
                <h3 className="text-xl font-semibold text-brand-primary">
                  Add your content
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  Upload FAQs, documents, website URLs, or YouTube videos. Our
                  AI learns your business instantly and speaks in your voice.
                </p>
              </div>
            </FadeInUp>

            {/* Step 3 */}
            <FadeInUp delay={0.2}>
              <div className="relative pl-16 sm:pl-20">
                <div className="bg-gradient-accent absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-brand-primary sm:h-16 sm:w-16 sm:text-base">
                  03
                </div>
                <h3 className="text-xl font-semibold text-brand-primary">
                  Embed & go live
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  Copy one line of code, paste it on your website, and start
                  capturing leads 24/7. Works with WordPress, Shopify, Wix,
                  Squarespace, Webflow, and any custom site.
                </p>
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* ─── EMBED PLATFORMS MARQUEE (reversed) ─── */}
      <section className="border-y border-brand-border/50 py-5">
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
                className="mx-4 inline-flex shrink-0 items-center gap-2 text-sm font-medium text-brand-light"
              >
                <Code className="h-3.5 w-3.5" />
                {platform}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING — single featured + mention others ─── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <FadeInUp>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-brand-primary sm:text-4xl">
                One new client pays for your{" "}
                <span className="text-gradient">entire year</span>
              </h2>
              <p className="mt-4 text-base text-brand-muted">
                Plans that make sense for service professionals.
              </p>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <div className="mx-auto mt-14 grid max-w-4xl gap-6 lg:grid-cols-[1fr_1.5fr_1fr]">
              {/* Basic */}
              <div className="flex flex-col rounded-2xl border border-brand-border bg-white p-7">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-light">
                  Basic
                </p>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-brand-primary">$20</span>
                  <span className="text-sm text-brand-muted">/mo</span>
                </div>
                <p className="mt-2 text-xs text-brand-muted">Solo practitioners</p>
                <ul className="mt-5 flex-1 space-y-2 text-xs text-brand-muted">
                  <li className="flex gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to" />
                    1 chatbot
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to" />
                    500 conversations/mo
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to" />
                    Knowledge base & forms
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="mt-6 block rounded-full border border-brand-border py-2 text-center text-xs font-semibold text-brand-primary transition-all hover:bg-brand-surface"
                >
                  Get Started
                </Link>
              </div>

              {/* Pro (featured) */}
              <div className="border-gradient relative flex flex-col rounded-2xl p-7 shadow-lg shadow-brand-accent-from/10">
                <div className="bg-gradient-accent absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold text-brand-primary">
                  Most Popular
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent-to">
                  Pro
                </p>
                <div className="mt-3">
                  <span className="text-4xl font-bold text-brand-primary">$50</span>
                  <span className="text-sm text-brand-muted">/mo</span>
                </div>
                <p className="mt-2 text-xs text-brand-muted">Growing practices</p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-brand-muted">
                  <li className="flex gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-accent-to" />
                    3 chatbots
                  </li>
                  <li className="flex gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-accent-to" />
                    Unlimited conversations
                  </li>
                  <li className="flex gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-accent-to" />
                    All knowledge types incl. YouTube
                  </li>
                  <li className="flex gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-accent-to" />
                    Booking wizard
                  </li>
                  <li className="flex gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-accent-to" />
                    White-label
                  </li>
                  <li className="flex gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-accent-to" />
                    Analytics dashboard
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="bg-gradient-accent mt-6 block rounded-full py-2.5 text-center text-sm font-semibold text-brand-primary transition-all hover:brightness-105"
                >
                  Get Started
                </Link>
              </div>

              {/* Agency */}
              <div className="flex flex-col rounded-2xl border border-brand-border bg-white p-7">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-light">
                  Agency
                </p>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-brand-primary">$150</span>
                  <span className="text-sm text-brand-muted">/mo</span>
                </div>
                <p className="mt-2 text-xs text-brand-muted">Agencies & teams</p>
                <ul className="mt-5 flex-1 space-y-2 text-xs text-brand-muted">
                  <li className="flex gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to" />
                    10 chatbots
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to" />
                    Unlimited everything
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to" />
                    Team management & API
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="mt-6 block rounded-full border border-brand-border py-2 text-center text-xs font-semibold text-brand-primary transition-all hover:bg-brand-surface"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.15}>
            <p className="mt-8 text-center text-sm text-brand-light">
              All plans include a 14-day free trial. No credit card required.{" "}
              <Link
                href="/pricing"
                className="font-medium text-brand-accent-to underline underline-offset-2 transition-colors hover:text-brand-accent-from"
              >
                Compare all features →
              </Link>
            </p>
          </FadeInUp>
        </div>
      </section>

      {/* ─── SECOND TESTIMONIAL ─── */}
      <section className="bg-brand-surface px-6 py-16">
        <FadeInOnly>
          <div className="mx-auto max-w-3xl text-center">
            <Quote className="mx-auto h-8 w-8 text-brand-accent-from opacity-50" />
            <blockquote className="mt-4 text-xl font-medium leading-relaxed text-brand-primary sm:text-2xl">
              &ldquo;Setup took less than 10 minutes. The chatbot now handles
              80% of the questions we used to answer manually.&rdquo;
            </blockquote>
            <div className="mt-5 text-sm text-brand-muted">
              <span className="font-semibold text-brand-secondary">Dr. James Okafor</span>
              {" "}— Okafor Financial Planning
            </div>
          </div>
        </FadeInOnly>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative overflow-hidden px-6 py-32">
        <div
          className="glow-orb left-1/4 top-0 h-[500px] w-[500px]"
          style={{ background: "rgba(255, 215, 140, 0.2)" }}
        />
        <div
          className="glow-orb right-1/4 bottom-0 h-[400px] w-[400px]"
          style={{ background: "rgba(255, 171, 122, 0.15)" }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <ScaleIn>
            <h2 className="text-3xl font-bold tracking-tight text-brand-primary sm:text-5xl">
              Stop losing 90% of your{" "}
              <span className="decorated-underline">website visitors</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-brand-muted sm:text-lg">
              Your competitors are already using AI chatbots. Every day without
              one is leads lost.
            </p>
            <Link
              href="/signup"
              className="bg-gradient-accent group mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-brand-primary shadow-lg shadow-brand-accent-from/20 transition-all hover:shadow-xl hover:shadow-brand-accent-from/30 hover:brightness-105"
            >
              Build your chatbot — free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </ScaleIn>
        </div>
      </section>
    </>
  );
}

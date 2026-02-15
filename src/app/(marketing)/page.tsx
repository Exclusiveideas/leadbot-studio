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
      <section className="relative overflow-hidden px-5 pb-16 pt-14 sm:px-6 sm:pb-28 sm:pt-28">
        {/* Glow orbs */}
        <div
          className="glow-orb -left-20 -top-20 h-[350px] w-[350px] sm:h-[600px] sm:w-[600px]"
          style={{ background: "rgba(255, 215, 140, 0.22)" }}
        />
        <div
          className="glow-orb -right-20 top-32 hidden h-[500px] w-[500px] sm:block"
          style={{ background: "rgba(255, 171, 122, 0.16)" }}
        />

        <div className="relative mx-auto max-w-4xl">
          <FadeInUp>
            <p className="text-center text-xs font-medium tracking-wide text-brand-muted sm:text-sm">
              AI chatbots for service professionals
            </p>
          </FadeInUp>

          <FadeInUp delay={0.08}>
            <h1 className="mt-4 text-center text-[clamp(2rem,6vw,4.5rem)] font-bold leading-[1.08] tracking-tight text-brand-primary sm:mt-5 sm:leading-[1.06]">
              The AI notepad that turns
              <br className="hidden sm:block" />{" "}
              your website into a{" "}
              <span className="decorated-underline">lead machine</span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.16}>
            <p className="mx-auto mt-5 max-w-xl text-center text-base leading-relaxed text-brand-muted sm:mt-7 sm:text-lg">
              Capture leads, answer questions, and book appointments
              automatically — even while you sleep. Set up in 5 minutes.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.24}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <Link
                href="/signup"
                className="bg-gradient-accent group inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3 text-[15px] font-semibold text-brand-primary shadow-lg shadow-brand-accent-from/20 transition-all hover:shadow-xl hover:shadow-brand-accent-from/30 hover:brightness-105 sm:w-auto"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex w-full items-center justify-center rounded-full border border-brand-border px-7 py-3 text-[15px] font-semibold text-brand-primary transition-all hover:border-brand-muted hover:bg-brand-surface sm:w-auto"
              >
                See it in action
              </Link>
            </div>
          </FadeInUp>
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
                  className="mx-2 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-border bg-white px-3.5 py-1.5 text-xs font-medium text-brand-primary transition-colors hover:border-brand-accent-from/50 hover:bg-brand-surface sm:mx-3 sm:gap-2 sm:px-5 sm:py-2 sm:text-sm"
                >
                  <ind.icon className="h-3.5 w-3.5 text-brand-muted" />
                  {ind.name}
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ─── FEATURE 1: AI Conversations — Asymmetric 2-col ─── */}
      <section className="px-5 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <FadeInUp>
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-muted sm:mb-4 sm:text-xs">
                <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Conversations
              </div>
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-brand-primary sm:text-3xl lg:text-4xl">
                Your AI talks to visitors so you don&apos;t have to
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-brand-muted sm:mt-5 sm:text-base">
                Natural language chatbot that understands context, answers
                questions from your knowledge base, and qualifies leads —
                all in your brand&apos;s voice.
              </p>
              <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                <li className="flex items-start gap-2 text-xs text-brand-muted sm:gap-2.5 sm:text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-accent-to sm:h-4 sm:w-4" />
                  Trained on your content — FAQs, docs, URLs, videos
                </li>
                <li className="flex items-start gap-2 text-xs text-brand-muted sm:gap-2.5 sm:text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-accent-to sm:h-4 sm:w-4" />
                  Qualifies leads before they reach your inbox
                </li>
                <li className="flex items-start gap-2 text-xs text-brand-muted sm:gap-2.5 sm:text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-accent-to sm:h-4 sm:w-4" />
                  Works 24/7 — nights, weekends, holidays
                </li>
              </ul>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.15}>
            <div className="feature-visual aspect-auto w-full p-5 sm:aspect-[4/3] sm:p-8 lg:p-12">
              {/* Chat mockup */}
              <div className="flex flex-col gap-2.5 sm:gap-3">
                <div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 text-xs text-brand-secondary shadow-sm sm:px-4 sm:py-2.5 sm:text-sm">
                  Hi! I was in a car accident last week. Do I have a case?
                </div>
                <div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-gradient-accent px-3.5 py-2 text-xs text-brand-primary shadow-sm sm:max-w-[80%] sm:px-4 sm:py-2.5 sm:text-sm">
                  I&apos;m sorry to hear that. I can help you understand your options. Were there any injuries involved?
                </div>
                <div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 text-xs text-brand-secondary shadow-sm sm:px-4 sm:py-2.5 sm:text-sm">
                  Yes, I&apos;ve been having back pain since the accident.
                </div>
                <div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-gradient-accent px-3.5 py-2 text-xs text-brand-primary shadow-sm sm:max-w-[80%] sm:px-4 sm:py-2.5 sm:text-sm">
                  Based on what you&apos;ve described, you may have grounds for a personal injury claim. Would you like to schedule a free consultation?
                </div>
                <div className="mt-0.5 self-end sm:mt-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary px-3 py-1 text-[10px] font-medium text-white sm:px-4 sm:py-1.5 sm:text-xs">
                    <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Book consultation
                  </div>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ─── INLINE TESTIMONIAL ─── */}
      <section className="border-y border-brand-border/50 px-5 py-10 sm:px-6 sm:py-16">
        <FadeInOnly>
          <div className="mx-auto max-w-3xl text-center">
            <Quote className="mx-auto h-6 w-6 text-brand-accent-from opacity-50 sm:h-8 sm:w-8" />
            <blockquote className="mt-3 text-lg font-medium leading-relaxed text-brand-primary sm:mt-4 sm:text-2xl">
              &ldquo;We went from 3 consultations per month to 15. The chatbot
              qualifies leads before they even talk to us.&rdquo;
            </blockquote>
            <div className="mt-4 text-xs text-brand-muted sm:mt-5 sm:text-sm">
              <span className="font-semibold text-brand-secondary">Sarah Mitchell</span>
              {" "}— Managing Partner, Mitchell Family Law
            </div>
          </div>
        </FadeInOnly>
      </section>

      {/* ─── FEATURE 2: Lead Capture — Reversed layout ─── */}
      <section className="px-5 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <FadeInUp>
            <div className="feature-visual aspect-auto w-full p-5 sm:aspect-[4/3] sm:p-8 lg:p-12 order-2 lg:order-1">
              {/* Lead form mockup */}
              <div className="mx-auto max-w-sm rounded-xl bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-semibold text-brand-primary sm:text-sm">
                  Almost there — let us know how to reach you
                </p>
                <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
                  <div className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-[11px] text-brand-muted sm:text-xs">
                    Full name
                  </div>
                  <div className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-[11px] text-brand-muted sm:text-xs">
                    Email address
                  </div>
                  <div className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-[11px] text-brand-muted sm:text-xs">
                    Phone number
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg border border-brand-accent-from/50 bg-brand-accent-from/10 px-3 py-2 text-center text-[11px] font-medium text-brand-primary sm:text-xs">
                      Urgent
                    </div>
                    <div className="flex-1 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-center text-[11px] text-brand-muted sm:text-xs">
                      Not urgent
                    </div>
                  </div>
                  <div className="bg-gradient-accent rounded-lg px-3 py-2 text-center text-[11px] font-semibold text-brand-primary sm:text-xs">
                    Request Callback
                  </div>
                </div>
                <p className="mt-2.5 text-center text-[9px] text-brand-light sm:mt-3 sm:text-[10px]">
                  AI pre-filled 2 of 3 fields from conversation
                </p>
              </div>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.15}>
            <div className="order-1 lg:order-2">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-muted sm:mb-4 sm:text-xs">
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Lead capture
              </div>
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-brand-primary sm:text-3xl lg:text-4xl">
                Capture leads without breaking the conversation
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-brand-muted sm:mt-5 sm:text-base">
                Dynamic forms appear at the right moment — after the AI has
                built trust and qualified intent. Information from the
                conversation auto-fills fields so visitors submit faster.
              </p>
              <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                <li className="flex items-start gap-2 text-xs text-brand-muted sm:gap-2.5 sm:text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-accent-to sm:h-4 sm:w-4" />
                  Conditional logic — different fields for different needs
                </li>
                <li className="flex items-start gap-2 text-xs text-brand-muted sm:gap-2.5 sm:text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-accent-to sm:h-4 sm:w-4" />
                  AI pre-fills fields from conversation context
                </li>
                <li className="flex items-start gap-2 text-xs text-brand-muted sm:gap-2.5 sm:text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-accent-to sm:h-4 sm:w-4" />
                  Instant email notifications for your team
                </li>
              </ul>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ─── FEATURE 3: Booking + Analytics — stacked showcase ─── */}
      <section className="bg-brand-primary px-5 py-16 text-white sm:px-6 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <FadeInUp>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                Book appointments.{" "}
                <span className="text-gradient">Track everything.</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/60 sm:mt-5 sm:text-base">
                Calendly integration, built-in booking wizard, and a real-time
                analytics dashboard — see exactly how your chatbot performs.
              </p>
            </div>
          </FadeInUp>

          <div className="mt-10 grid gap-5 sm:mt-16 sm:gap-6 lg:grid-cols-2">
            <FadeInUp delay={0.1}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-8">
                <Calendar className="h-6 w-6 text-brand-accent-from sm:h-8 sm:w-8" />
                <h3 className="mt-3 text-lg font-semibold sm:mt-4 sm:text-xl">
                  Appointment Booking
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/50 sm:mt-2 sm:text-sm">
                  Visitors book directly from the chat — no phone tag, no
                  back-and-forth emails. Integrates with Calendly or use our
                  built-in booking wizard.
                </p>
                {/* Mini calendar mockup */}
                <div className="mt-4 grid grid-cols-7 gap-0.5 rounded-xl bg-white/5 p-2.5 sm:mt-6 sm:gap-1 sm:p-4">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div
                      key={`day-${i}`}
                      className="text-center text-[9px] font-medium text-white/30 sm:text-[10px]"
                    >
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: 28 }, (_, i) => (
                    <div
                      key={`date-${i}`}
                      className={`flex h-5 items-center justify-center rounded-md text-[10px] sm:h-7 sm:text-xs ${
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
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-8">
                <BarChart3 className="h-6 w-6 text-brand-accent-from sm:h-8 sm:w-8" />
                <h3 className="mt-3 text-lg font-semibold sm:mt-4 sm:text-xl">
                  Analytics Dashboard
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/50 sm:mt-2 sm:text-sm">
                  Track conversations, leads, and conversion rates in real time.
                  Know what questions prospects ask most and optimize your
                  chatbot.
                </p>
                {/* Mini chart mockup */}
                <div className="mt-4 flex items-end gap-1 rounded-xl bg-white/5 p-2.5 sm:mt-6 sm:gap-2 sm:p-4">
                  {[35, 45, 30, 60, 50, 75, 65, 80, 70, 90, 85, 95].map(
                    (h, i) => (
                      <div
                        key={`bar-${i}`}
                        className="flex-1 rounded-t-sm bg-gradient-accent opacity-70"
                        style={{ height: `${Math.round(h * 0.6)}px` }}
                      />
                    ),
                  )}
                </div>
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS — Vertical timeline ─── */}
      <section className="px-5 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-3xl">
          <FadeInUp>
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-brand-primary sm:text-3xl lg:text-4xl">
                Go live in 5 minutes
              </h2>
              <p className="mt-3 text-sm text-brand-muted sm:mt-4 sm:text-base">
                No coding. No developers. No complexity.
              </p>
            </div>
          </FadeInUp>

          <div className="relative mt-10 sm:mt-16">
            {/* Vertical line */}
            <div className="absolute bottom-0 left-[22px] top-0 w-px bg-brand-border sm:left-8" />

            {/* Step 1 */}
            <FadeInUp>
              <div className="relative mb-10 pl-14 sm:mb-14 sm:pl-20">
                <div className="bg-gradient-accent absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-brand-primary sm:h-16 sm:w-16 sm:text-base">
                  01
                </div>
                <h3 className="text-lg font-semibold text-brand-primary sm:text-xl">
                  Choose your industry
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-brand-muted sm:mt-2 sm:text-sm">
                  Select from pre-built templates for law firms, coaches,
                  therapists, real estate, financial advisors — or create a
                  fully custom bot from scratch.
                </p>
              </div>
            </FadeInUp>

            {/* Step 2 */}
            <FadeInUp delay={0.1}>
              <div className="relative mb-10 pl-14 sm:mb-14 sm:pl-20">
                <div className="bg-gradient-accent absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-brand-primary sm:h-16 sm:w-16 sm:text-base">
                  02
                </div>
                <h3 className="text-lg font-semibold text-brand-primary sm:text-xl">
                  Add your content
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-brand-muted sm:mt-2 sm:text-sm">
                  Upload FAQs, documents, website URLs, or YouTube videos. Our
                  AI learns your business instantly and speaks in your voice.
                </p>
              </div>
            </FadeInUp>

            {/* Step 3 */}
            <FadeInUp delay={0.2}>
              <div className="relative pl-14 sm:pl-20">
                <div className="bg-gradient-accent absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-brand-primary sm:h-16 sm:w-16 sm:text-base">
                  03
                </div>
                <h3 className="text-lg font-semibold text-brand-primary sm:text-xl">
                  Embed & go live
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-brand-muted sm:mt-2 sm:text-sm">
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
      <section className="px-5 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <FadeInUp>
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-brand-primary sm:text-3xl lg:text-4xl">
                One new client pays for your{" "}
                <span className="text-gradient">entire year</span>
              </h2>
              <p className="mt-3 text-sm text-brand-muted sm:mt-4 sm:text-base">
                Plans that make sense for service professionals.
              </p>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            {/* On mobile: stack with Pro first. On desktop: 3-col asymmetric */}
            <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-5 sm:mt-14 sm:gap-6 lg:flex-row lg:items-start">
              {/* Basic — hidden on mobile, shown on lg */}
              <div className="hidden flex-1 flex-col rounded-2xl border border-brand-border bg-white p-6 lg:flex lg:p-7">
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

              {/* Pro (featured) — always visible, shown first on mobile */}
              <div className="border-gradient relative flex flex-col rounded-2xl p-6 shadow-lg shadow-brand-accent-from/10 sm:p-7 lg:flex-[1.5]">
                <div className="bg-gradient-accent absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-semibold text-brand-primary sm:text-xs">
                  Most Popular
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent-to">
                  Pro
                </p>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-brand-primary sm:text-4xl">$50</span>
                  <span className="text-sm text-brand-muted">/mo</span>
                </div>
                <p className="mt-2 text-xs text-brand-muted">Growing practices</p>
                <ul className="mt-5 flex-1 space-y-2 text-xs text-brand-muted sm:space-y-2.5 sm:text-sm">
                  <li className="flex gap-2 sm:gap-2.5">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to sm:h-4 sm:w-4" />
                    3 chatbots
                  </li>
                  <li className="flex gap-2 sm:gap-2.5">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to sm:h-4 sm:w-4" />
                    Unlimited conversations
                  </li>
                  <li className="flex gap-2 sm:gap-2.5">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to sm:h-4 sm:w-4" />
                    All knowledge types incl. YouTube
                  </li>
                  <li className="flex gap-2 sm:gap-2.5">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to sm:h-4 sm:w-4" />
                    Booking wizard
                  </li>
                  <li className="flex gap-2 sm:gap-2.5">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to sm:h-4 sm:w-4" />
                    White-label
                  </li>
                  <li className="flex gap-2 sm:gap-2.5">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent-to sm:h-4 sm:w-4" />
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

              {/* Basic + Agency on mobile (side by side) */}
              <div className="grid grid-cols-2 gap-4 lg:hidden">
                <div className="flex flex-col rounded-2xl border border-brand-border bg-white p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-light">
                    Basic
                  </p>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-brand-primary">$20</span>
                    <span className="text-xs text-brand-muted">/mo</span>
                  </div>
                  <ul className="mt-3 flex-1 space-y-1.5 text-[11px] text-brand-muted">
                    <li className="flex gap-1.5">
                      <Check className="h-3 w-3 shrink-0 text-brand-accent-to" />
                      1 chatbot
                    </li>
                    <li className="flex gap-1.5">
                      <Check className="h-3 w-3 shrink-0 text-brand-accent-to" />
                      500 convos/mo
                    </li>
                    <li className="flex gap-1.5">
                      <Check className="h-3 w-3 shrink-0 text-brand-accent-to" />
                      Knowledge base
                    </li>
                  </ul>
                  <Link
                    href="/signup"
                    className="mt-4 block rounded-full border border-brand-border py-1.5 text-center text-[11px] font-semibold text-brand-primary"
                  >
                    Get Started
                  </Link>
                </div>
                <div className="flex flex-col rounded-2xl border border-brand-border bg-white p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-light">
                    Agency
                  </p>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-brand-primary">$150</span>
                    <span className="text-xs text-brand-muted">/mo</span>
                  </div>
                  <ul className="mt-3 flex-1 space-y-1.5 text-[11px] text-brand-muted">
                    <li className="flex gap-1.5">
                      <Check className="h-3 w-3 shrink-0 text-brand-accent-to" />
                      10 chatbots
                    </li>
                    <li className="flex gap-1.5">
                      <Check className="h-3 w-3 shrink-0 text-brand-accent-to" />
                      Unlimited all
                    </li>
                    <li className="flex gap-1.5">
                      <Check className="h-3 w-3 shrink-0 text-brand-accent-to" />
                      Team & API
                    </li>
                  </ul>
                  <Link
                    href="/signup"
                    className="mt-4 block rounded-full border border-brand-border py-1.5 text-center text-[11px] font-semibold text-brand-primary"
                  >
                    Get Started
                  </Link>
                </div>
              </div>

              {/* Agency — hidden on mobile, shown on lg */}
              <div className="hidden flex-1 flex-col rounded-2xl border border-brand-border bg-white p-6 lg:flex lg:p-7">
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
            <p className="mt-6 text-center text-xs text-brand-light sm:mt-8 sm:text-sm">
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
      <section className="bg-brand-surface px-5 py-10 sm:px-6 sm:py-16">
        <FadeInOnly>
          <div className="mx-auto max-w-3xl text-center">
            <Quote className="mx-auto h-6 w-6 text-brand-accent-from opacity-50 sm:h-8 sm:w-8" />
            <blockquote className="mt-3 text-lg font-medium leading-relaxed text-brand-primary sm:mt-4 sm:text-2xl">
              &ldquo;Setup took less than 10 minutes. The chatbot now handles
              80% of the questions we used to answer manually.&rdquo;
            </blockquote>
            <div className="mt-4 text-xs text-brand-muted sm:mt-5 sm:text-sm">
              <span className="font-semibold text-brand-secondary">Dr. James Okafor</span>
              {" "}— Okafor Financial Planning
            </div>
          </div>
        </FadeInOnly>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative overflow-hidden px-5 py-20 sm:px-6 sm:py-32">
        <div
          className="glow-orb left-1/4 top-0 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px]"
          style={{ background: "rgba(255, 215, 140, 0.2)" }}
        />
        <div
          className="glow-orb right-1/4 bottom-0 hidden h-[400px] w-[400px] sm:block"
          style={{ background: "rgba(255, 171, 122, 0.15)" }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <ScaleIn>
            <h2 className="text-2xl font-bold tracking-tight text-brand-primary sm:text-4xl lg:text-5xl">
              Stop losing 90% of your{" "}
              <span className="decorated-underline">website visitors</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-muted sm:mt-6 sm:text-lg">
              Your competitors are already using AI chatbots. Every day without
              one is leads lost.
            </p>
            <Link
              href="/signup"
              className="bg-gradient-accent group mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-brand-primary shadow-lg shadow-brand-accent-from/20 transition-all hover:shadow-xl hover:shadow-brand-accent-from/30 hover:brightness-105 sm:mt-8 sm:px-8 sm:py-3.5 sm:text-base"
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

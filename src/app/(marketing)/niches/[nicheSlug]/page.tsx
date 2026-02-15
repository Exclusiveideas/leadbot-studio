"use client";

import Link from "next/link";
import {
  Check,
  ArrowRight,
  X,
  MessageSquare,
  FileSearch,
  FolderOpen,
  Search,
} from "lucide-react";
import { notFound, useParams } from "next/navigation";
import {
  ScrollReveal,
  StaggerReveal,
} from "@/components/marketing/gsap-animations";
import { motion } from "framer-motion";

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

const nicheData: Record<
  string,
  {
    name: string;
    headline: string;
    subheadline: string;
    painPoints: string[];
    howItHelps: { title: string; description: string }[];
    sampleQuestions: string[];
    ctaText: string;
  }
> = {
  "law-firm": {
    name: "Law Firms",
    headline: "Turn Your Law Firm Website Into a Client Intake Machine",
    subheadline:
      "AI chatbot that qualifies potential clients, answers common legal questions from your knowledge base, and books consultations — 24/7.",
    painPoints: [
      "90% of website visitors leave without contacting you",
      "Phone calls during business hours miss after-hours prospects",
      "Intake forms get abandoned halfway through",
      "Staff time wasted on unqualified leads",
    ],
    howItHelps: [
      {
        title: "Qualify Leads Automatically",
        description:
          "AI asks about case type, urgency, and budget before suggesting a consultation. Only qualified leads reach your inbox.",
      },
      {
        title: "Answer FAQs Instantly",
        description:
          'Upload your FAQs and the chatbot handles "Do I have a case?" questions accurately, without providing legal advice.',
      },
      {
        title: "Book Consultations 24/7",
        description:
          "Calendly integration or built-in booking wizard lets visitors schedule directly from the chat.",
      },
      {
        title: "Capture Every Lead",
        description:
          "Dynamic lead forms with conditional logic capture name, email, phone, case type, and urgency level.",
      },
    ],
    sampleQuestions: [
      "I was in a car accident last week. Do I have a case?",
      "How much does a consultation cost?",
      "What areas of law do you practice?",
      "Can I schedule a free consultation?",
    ],
    ctaText: "Build Your Law Firm Chatbot",
  },
  "business-coach": {
    name: "Business Coaches",
    headline: "Convert Website Visitors Into Discovery Call Bookings",
    subheadline:
      "AI chatbot that engages prospects, demonstrates your expertise, and books discovery calls — even while you sleep.",
    painPoints: [
      "Prospects browse your site but never reach out",
      "You spend hours on calls with unqualified leads",
      "Your expertise isn't showcased beyond static pages",
      "Follow-up emails go unanswered",
    ],
    howItHelps: [
      {
        title: "Engage Prospects Instantly",
        description:
          "AI greets visitors warmly, asks about their business challenges, and shares relevant insights from your methodology.",
      },
      {
        title: "Demonstrate Expertise",
        description:
          "Upload your frameworks, case studies, and content. The chatbot shares your knowledge naturally in conversation.",
      },
      {
        title: "Qualify by Business Stage",
        description:
          "AI identifies business stage, revenue level, and coaching readiness before suggesting a discovery call.",
      },
      {
        title: "Book Discovery Calls",
        description:
          "Seamless handoff to your calendar when a prospect is ready, with context from the conversation included.",
      },
    ],
    sampleQuestions: [
      "I'm stuck at $500K revenue. Can you help me scale?",
      "What's your coaching approach?",
      "How long does a typical engagement last?",
      "Can I book a free strategy session?",
    ],
    ctaText: "Build Your Coaching Chatbot",
  },
  therapist: {
    name: "Therapists",
    headline: "Help More People Find the Right Therapist — You",
    subheadline:
      "Compassionate AI chatbot that reduces stigma, answers questions about your practice, and schedules initial consultations.",
    painPoints: [
      "People hesitate to call a therapist directly",
      "Your website doesn't address their fears and questions",
      "Phone tag with new patients delays care",
      "You lose potential clients to therapists with better online presence",
    ],
    howItHelps: [
      {
        title: "Reduce Barriers to Care",
        description:
          "A warm, non-judgmental chatbot that answers questions about therapy types, what to expect, and insurance — lowering the barrier to reach out.",
      },
      {
        title: "Match Clients to Your Specialties",
        description:
          "AI learns about the visitor's concerns and gently suggests whether your practice is a good fit.",
      },
      {
        title: "Handle Sensitive Topics Safely",
        description:
          "Built-in boundaries ensure the chatbot never provides therapy or diagnoses. Crisis situations are directed to 988 Lifeline.",
      },
      {
        title: "Schedule Initial Consultations",
        description:
          "When someone is ready, the chatbot captures their info and books an initial session through your calendar.",
      },
    ],
    sampleQuestions: [
      "I've been feeling anxious lately. Can therapy help?",
      "Do you accept Blue Cross insurance?",
      "What's the difference between CBT and talk therapy?",
      "How do I schedule my first appointment?",
    ],
    ctaText: "Build Your Therapy Practice Chatbot",
  },
  "real-estate": {
    name: "Real Estate Agents",
    headline: "Capture Every Lead From Your Real Estate Website",
    subheadline:
      "AI chatbot that qualifies buyers and sellers, answers property questions, and schedules showings — around the clock.",
    painPoints: [
      "Leads from your website go cold before you can respond",
      "You miss inquiries that come in after hours",
      "Zillow and Realtor.com take a huge commission",
      "Qualifying buyers over phone is time-consuming",
    ],
    howItHelps: [
      {
        title: "Qualify Buyers & Sellers",
        description:
          "AI asks about timeline, budget, location preferences, and whether they're pre-approved — before you ever pick up the phone.",
      },
      {
        title: "Answer Property Questions",
        description:
          "Upload your listings, neighborhood guides, and market data. The chatbot becomes your 24/7 listing assistant.",
      },
      {
        title: "Schedule Showings",
        description:
          "Built-in booking wizard lets qualified buyers schedule showings directly from the chat.",
      },
      {
        title: "Capture Seller Leads",
        description:
          "Engage homeowners thinking about selling with market insights and home valuation conversations.",
      },
    ],
    sampleQuestions: [
      "I'm looking for a 3-bedroom house under $500K",
      "What neighborhoods do you recommend for families?",
      "Can I schedule a showing for this weekend?",
      "How much is my home worth?",
    ],
    ctaText: "Build Your Real Estate Chatbot",
  },
  "financial-advisor": {
    name: "Financial Advisors",
    headline: "Turn Website Visitors Into Planning Session Bookings",
    subheadline:
      "AI chatbot that educates prospects about your services, qualifies leads by assets and goals, and books planning sessions.",
    painPoints: [
      "Prospects don't understand the value of financial planning",
      "Your website doesn't convert visitors into consultations",
      "Cold outreach has low conversion rates",
      "Compliance concerns limit what you can say online",
    ],
    howItHelps: [
      {
        title: "Educate Prospects",
        description:
          "AI explains your services, investment philosophy, and planning process in conversational terms that build trust.",
      },
      {
        title: "Qualify by Financial Goals",
        description:
          "AI identifies investment goals, timeline, and investable assets to ensure prospects match your minimum requirements.",
      },
      {
        title: "Stay Compliant",
        description:
          "Built-in boundaries ensure the chatbot never provides investment advice, specific recommendations, or performance guarantees.",
      },
      {
        title: "Book Planning Sessions",
        description:
          "When a qualified prospect is ready, seamlessly schedule a discovery meeting through your calendar.",
      },
    ],
    sampleQuestions: [
      "I want to plan for retirement. Where do I start?",
      "What's the minimum investment to work with you?",
      "Do you offer fee-only financial planning?",
      "Can I schedule a free consultation?",
    ],
    ctaText: "Build Your Financial Advisor Chatbot",
  },
};

export default function NicheLandingPage() {
  const params = useParams();
  const nicheSlug = params.nicheSlug as string;
  const niche = nicheData[nicheSlug];

  if (!niche) {
    notFound();
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-16 sm:pb-24 sm:pt-28 lg:px-8">
        <div className="gradient-mesh absolute inset-0" />
        <div className="bg-dot-grid absolute inset-0 opacity-30" />

        <div className="relative mx-auto max-w-4xl">
          <motion.div
            variants={heroFade}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-brand-accent-from/30 bg-brand-accent-from/10 px-3 py-1.5 text-xs font-medium text-brand-secondary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-accent" />
              {niche.name}
            </div>
          </motion.div>

          <motion.div
            variants={heroSlideLeft}
            initial="hidden"
            animate="visible"
            custom={0.1}
          >
            <h1 className="max-w-3xl text-[clamp(2rem,4vw+0.5rem,3.5rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-brand-primary">
              {niche.headline}
            </h1>
          </motion.div>

          <motion.div
            variants={heroFade}
            initial="hidden"
            animate="visible"
            custom={0.2}
          >
            <p className="mt-6 max-w-2xl text-lg leading-[1.7] text-brand-muted">
              {niche.subheadline}
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
                {niche.ctaText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-brand-muted underline underline-offset-4 transition-colors hover:text-brand-primary"
              >
                See it in action
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="bg-brand-surface px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal direction="left" distance={40}>
            <div className="mb-10 sm:mb-14">
              <div className="accent-line mb-5" />
              <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold tracking-[-0.02em] text-brand-primary">
                Sound familiar?
              </h2>
            </div>
          </ScrollReveal>

          <StaggerReveal
            className="grid gap-3 sm:grid-cols-2 sm:gap-4"
            childSelector=".stagger-item"
          >
            {niche.painPoints.map((pain) => (
              <div
                key={pain}
                className="stagger-item flex items-start gap-3.5 rounded-xl border border-red-100 bg-white p-5 elevation-1"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-50">
                  <X className="h-3.5 w-3.5 text-red-400" />
                </div>
                <span className="text-sm leading-[1.7] text-brand-secondary">
                  {pain}
                </span>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* How It Helps */}
      <section className="px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal direction="left" distance={40}>
            <div className="mb-12 max-w-xl sm:mb-16">
              <div className="accent-line mb-5" />
              <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold tracking-[-0.02em] text-brand-primary">
                How LeadBotStudio helps
              </h2>
            </div>
          </ScrollReveal>

          <StaggerReveal
            className="grid gap-6 sm:gap-8 md:grid-cols-2"
            childSelector=".stagger-item"
          >
            {niche.howItHelps.map((item) => (
              <div key={item.title} className="stagger-item flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-accent-from/15">
                  <Check className="h-4 w-4 text-brand-accent-to" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight text-brand-primary">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-[1.7] text-brand-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* Sample Questions */}
      <section className="bg-brand-surface px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal direction="left" distance={40}>
            <div className="mb-10 sm:mb-14">
              <div className="accent-line mb-5" />
              <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold tracking-[-0.02em] text-brand-primary">
                Questions your chatbot can handle
              </h2>
            </div>
          </ScrollReveal>

          <StaggerReveal
            className="grid gap-3 sm:grid-cols-2 sm:gap-4"
            childSelector=".stagger-item"
          >
            {niche.sampleQuestions.map((q) => (
              <div
                key={q}
                className="stagger-item flex items-start gap-3.5 rounded-xl border border-brand-border bg-white p-5 elevation-1"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-accent-from/10">
                  <MessageSquare className="h-3.5 w-3.5 text-brand-accent-to" />
                </div>
                <p className="text-sm leading-[1.7] text-brand-muted">
                  &ldquo;{q}&rdquo;
                </p>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* Seira AI Bridge — Law Firms only */}
      {nicheSlug === "law-firm" && (
        <section className="relative overflow-hidden bg-brand-primary px-6 py-20 sm:py-28 lg:px-8">
          <div className="bg-dot-grid absolute inset-0 opacity-10" />
          <div
            className="glow-orb -right-16 top-0 h-[300px] w-[300px]"
            style={{ background: "rgba(55, 132, 255, 0.08)" }}
          />

          <div className="relative mx-auto max-w-4xl">
            <ScrollReveal direction="up">
              <div className="mb-12 sm:mb-14">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white/50">
                  BUILT BY SEIRA AI
                </div>
                <h2 className="max-w-2xl text-[clamp(1.5rem,3vw+0.5rem,2.5rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
                  Your AI-powered legal practice,{" "}
                  <span className="text-gradient">end to end</span>
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-[1.7] text-white/45">
                  LeadBotStudio captures your clients. Seira AI helps you serve
                  them — with AI document processing, intelligent case
                  management, and e-discovery that&apos;s 10x faster.
                </p>
              </div>
            </ScrollReveal>

            <StaggerReveal
              className="grid gap-5 sm:gap-6 md:grid-cols-3"
              childSelector=".stagger-item"
            >
              {[
                {
                  icon: FileSearch,
                  title: "AI Document Processing",
                  description:
                    "Auto-classify contracts, pleadings, and emails. OCR with 99.5% accuracy. Process thousands of documents simultaneously.",
                },
                {
                  icon: FolderOpen,
                  title: "Case Management",
                  description:
                    "Organize documents by case, collaborate with your team, and maintain full audit trails for compliance.",
                },
                {
                  icon: Search,
                  title: "AI-Powered Search",
                  description:
                    "Semantic search across all your case documents. Find what matters in seconds, not hours.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="stagger-item rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/20">
                    <item.icon className="h-5 w-5 text-brand-blue" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-[1.7] text-white/45">
                    {item.description}
                  </p>
                </div>
              ))}
            </StaggerReveal>

            <ScrollReveal direction="up" delay={0.2}>
              <div className="mt-10 text-center">
                <a
                  href="https://seira.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:border-white/25 hover:bg-white/10"
                >
                  See how Seira AI transforms legal workflows
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* CTA */}
      <section
        className={`relative overflow-hidden px-6 py-20 sm:py-28 lg:px-8 ${nicheSlug === "law-firm" ? "bg-brand-surface" : "bg-brand-primary"}`}
      >
        {nicheSlug !== "law-firm" && (
          <>
            <div className="bg-dot-grid absolute inset-0 opacity-10" />
            <div
              className="glow-orb left-0 top-0 h-[300px] w-[300px]"
              style={{ background: "rgba(255, 215, 140, 0.1)" }}
            />
            <div
              className="glow-orb bottom-0 right-0 h-[250px] w-[250px]"
              style={{ background: "rgba(255, 171, 122, 0.06)" }}
            />
          </>
        )}
        {nicheSlug === "law-firm" && (
          <div className="bg-dot-grid absolute inset-0 opacity-30" />
        )}

        <div className="relative mx-auto max-w-2xl text-center">
          <ScrollReveal direction="up">
            <h2
              className={`text-[clamp(1.5rem,3vw+0.5rem,2.5rem)] font-extrabold leading-[1.15] tracking-[-0.02em] ${nicheSlug === "law-firm" ? "text-brand-primary" : "text-white"}`}
            >
              Ready to start capturing leads?
            </h2>
            <p
              className={`mt-4 text-base leading-[1.7] ${nicheSlug === "law-firm" ? "text-brand-muted" : "text-white/50"}`}
            >
              Set up your {niche.name.toLowerCase()} chatbot in 5 minutes. No
              coding required.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="bg-gradient-accent group inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-semibold text-brand-primary shadow-[0_8px_30px_rgba(255,171,122,0.25)] transition-all hover:shadow-[0_12px_40px_rgba(255,171,122,0.35)] hover:brightness-105"
              >
                {niche.ctaText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pricing"
                className={`inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 transition-colors ${nicheSlug === "law-firm" ? "text-brand-muted hover:text-brand-primary" : "text-white/50 hover:text-white"}`}
              >
                View pricing
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

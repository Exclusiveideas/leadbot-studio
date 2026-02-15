import Link from "next/link";
import { Check, ArrowRight, X } from "lucide-react";
import { notFound } from "next/navigation";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  ScaleIn,
} from "@/components/marketing/motion";

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
          "Upload your FAQs and the chatbot handles 'Do I have a case?' questions accurately, without providing legal advice.",
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

export default async function NicheLandingPage({
  params,
}: {
  params: Promise<{ nicheSlug: string }>;
}) {
  const { nicheSlug } = await params;
  const niche = nicheData[nicheSlug];

  if (!niche) {
    notFound();
  }

  return (
    <div className="px-6 py-28">
      <div className="mx-auto max-w-5xl">
        {/* Hero */}
        <FadeInUp>
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 py-1.5 text-xs font-medium text-brand-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-accent" />
              {niche.name}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl">
              {niche.headline}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-brand-muted">
              {niche.subheadline}
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="bg-gradient-accent group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-brand-primary shadow-lg shadow-brand-accent-from/20 transition-all hover:shadow-xl hover:brightness-105"
              >
                {niche.ctaText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </FadeInUp>

        {/* Pain Points */}
        <div className="mt-28">
          <FadeInUp>
            <h2 className="text-center text-2xl font-bold tracking-tight text-brand-primary sm:text-3xl">
              Sound Familiar?
            </h2>
          </FadeInUp>

          <StaggerContainer className="mt-10 grid gap-4 sm:grid-cols-2">
            {niche.painPoints.map((pain) => (
              <StaggerItem key={pain}>
                <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-5">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <X className="h-3 w-3 text-red-500" />
                  </div>
                  <span className="text-sm leading-relaxed text-brand-secondary">
                    {pain}
                  </span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* How It Helps */}
        <div className="mt-28">
          <FadeInUp>
            <h2 className="text-center text-2xl font-bold tracking-tight text-brand-primary sm:text-3xl">
              How LeadBotStudio Helps
            </h2>
          </FadeInUp>

          <StaggerContainer className="mt-12 grid gap-8 md:grid-cols-2">
            {niche.howItHelps.map((item) => (
              <StaggerItem key={item.title}>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-accent text-brand-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-primary">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-brand-muted">
                      {item.description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* Sample Questions */}
        <div className="mt-28">
          <FadeInUp>
            <h2 className="text-center text-2xl font-bold tracking-tight text-brand-primary sm:text-3xl">
              Questions Your Chatbot Can Handle
            </h2>
          </FadeInUp>

          <StaggerContainer className="mt-10 grid gap-4 sm:grid-cols-2">
            {niche.sampleQuestions.map((q) => (
              <StaggerItem key={q}>
                <div className="rounded-2xl border border-brand-border bg-white p-5">
                  <p className="text-sm italic leading-relaxed text-brand-muted">
                    &ldquo;{q}&rdquo;
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* CTA */}
        <div className="relative mt-28 overflow-hidden rounded-3xl bg-brand-primary px-8 py-16 text-center">
          <div
            className="glow-orb left-0 top-0 h-[300px] w-[300px]"
            style={{ background: "rgba(255, 215, 140, 0.15)" }}
          />
          <div
            className="glow-orb bottom-0 right-0 h-[250px] w-[250px]"
            style={{ background: "rgba(255, 171, 122, 0.1)" }}
          />

          <ScaleIn>
            <div className="relative">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Ready to Start Capturing Leads?
              </h2>
              <p className="mt-4 text-white/60">
                Set up your {niche.name.toLowerCase()} chatbot in 5 minutes. No
                coding required.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="bg-gradient-accent group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-brand-primary transition-all hover:brightness-105"
                >
                  {niche.ctaText}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-full border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </ScaleIn>
        </div>
      </div>
    </div>
  );
}

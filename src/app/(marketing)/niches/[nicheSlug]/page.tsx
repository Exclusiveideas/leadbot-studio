import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

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
    color: string;
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
    color: "blue",
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
    color: "purple",
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
    color: "green",
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
    color: "red",
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
    color: "sky",
  },
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: {
    bg: "bg-blue-600",
    text: "text-blue-600",
    border: "border-blue-600",
  },
  purple: {
    bg: "bg-purple-600",
    text: "text-purple-600",
    border: "border-purple-600",
  },
  green: {
    bg: "bg-green-600",
    text: "text-green-600",
    border: "border-green-600",
  },
  red: { bg: "bg-red-600", text: "text-red-600", border: "border-red-600" },
  sky: { bg: "bg-sky-600", text: "text-sky-600", border: "border-sky-600" },
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

  const colors = colorMap[niche.color] || colorMap.blue;

  return (
    <div className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        {/* Hero */}
        <div className="text-center">
          <p
            className={`text-sm font-semibold uppercase tracking-wide ${colors.text}`}
          >
            {niche.name}
          </p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900 sm:text-5xl">
            {niche.headline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            {niche.subheadline}
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className={`inline-block rounded-lg ${colors.bg} px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:opacity-90`}
            >
              {niche.ctaText}
            </Link>
          </div>
        </div>

        {/* Pain Points */}
        <div className="mt-24">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Sound Familiar?
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {niche.painPoints.map((pain) => (
              <div
                key={pain}
                className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4"
              >
                <span className="mt-0.5 text-red-500">&#10007;</span>
                <span className="text-sm text-gray-700">{pain}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How It Helps */}
        <div className="mt-24">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            How LeadBotStudio Helps
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {niche.howItHelps.map((item) => (
              <div key={item.title} className="flex gap-4">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colors.bg} text-white`}
                >
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Questions */}
        <div className="mt-24">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Questions Your Chatbot Can Handle
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {niche.sampleQuestions.map((q) => (
              <div
                key={q}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <p className="text-sm italic text-gray-600">
                  &ldquo;{q}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Ready to Start Capturing Leads?
          </h2>
          <p className="mt-4 text-gray-600">
            Set up your {niche.name.toLowerCase()} chatbot in 5 minutes. No
            coding required.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className={`inline-flex items-center gap-2 rounded-lg ${colors.bg} px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:opacity-90`}
            >
              {niche.ctaText}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

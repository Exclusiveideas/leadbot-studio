import Link from "next/link";
import {
  Scale,
  Target,
  Heart,
  Home,
  TrendingUp,
  Sparkles,
  MessageSquare,
  Users,
  Calendar,
  BarChart3,
  Code,
  Zap,
} from "lucide-react";

const niches = [
  {
    name: "Law Firms",
    description: "Qualify clients, answer legal questions, book consultations",
    icon: Scale,
    color: "bg-blue-100 text-blue-700",
    href: "/niches/law-firm",
  },
  {
    name: "Business Coaches",
    description: "Engage prospects, demonstrate expertise, book discovery calls",
    icon: Target,
    color: "bg-purple-100 text-purple-700",
    href: "/niches/business-coach",
  },
  {
    name: "Therapists",
    description:
      "Reduce stigma, answer questions, schedule initial consultations",
    icon: Heart,
    color: "bg-green-100 text-green-700",
    href: "/niches/therapist",
  },
  {
    name: "Real Estate Agents",
    description: "Qualify buyers/sellers, schedule showings, capture leads",
    icon: Home,
    color: "bg-red-100 text-red-700",
    href: "/niches/real-estate",
  },
  {
    name: "Financial Advisors",
    description: "Educate prospects, qualify leads, book planning sessions",
    icon: TrendingUp,
    color: "bg-sky-100 text-sky-700",
    href: "/niches/financial-advisor",
  },
  {
    name: "Custom",
    description: "Build a chatbot for any business with full customization",
    icon: Sparkles,
    color: "bg-gray-100 text-gray-700",
    href: "/signup",
  },
];

const features = [
  {
    name: "AI-Powered Conversations",
    description:
      "Natural language chatbot that understands context, answers questions from your knowledge base, and qualifies leads.",
    icon: MessageSquare,
  },
  {
    name: "Smart Lead Capture",
    description:
      "Dynamic forms with conditional logic that capture qualified leads. AI extracts info from conversation to pre-fill fields.",
    icon: Users,
  },
  {
    name: "Appointment Booking",
    description:
      "Calendly integration and built-in booking wizard. Visitors book appointments directly without leaving your site.",
    icon: Calendar,
  },
  {
    name: "Analytics Dashboard",
    description:
      "Track conversations, leads, and conversion rates. Know what prospects ask most and optimize your chatbot.",
    icon: BarChart3,
  },
  {
    name: "Easy Embed",
    description:
      "One line of code. Works with WordPress, Shopify, Wix, Squarespace, Webflow, and any custom website.",
    icon: Code,
  },
  {
    name: "5-Minute Setup",
    description:
      "Choose your industry, upload your content, customize branding, and go live. No coding required.",
    icon: Zap,
  },
];

const steps = [
  {
    number: "1",
    title: "Choose Your Industry",
    description:
      "Select from pre-built templates for law firms, coaches, therapists, real estate, financial advisors, or create a custom bot.",
  },
  {
    number: "2",
    title: "Add Your Content",
    description:
      "Upload FAQs, documents, website URLs, or YouTube videos. Our AI learns your business instantly.",
  },
  {
    number: "3",
    title: "Embed & Go Live",
    description:
      "Copy one line of code, paste it on your website, and start capturing leads 24/7.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Turn Your Website Into a{" "}
            <span className="text-blue-600">24/7 Sales Machine</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            AI chatbots built for your industry. Capture leads, answer
            questions, and book appointments automatically — even while you
            sleep. Set up in 5 minutes.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Start Free
            </Link>
            <Link
              href="/demo"
              className="rounded-lg border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              See Demo
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No credit card required. Free plan available.
          </p>
        </div>
      </section>

      {/* Niche Showcase */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Built for Your Industry
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Pre-configured templates with industry-specific prompts, lead
              forms, and qualification logic.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {niches.map((niche) => (
              <Link
                key={niche.name}
                href={niche.href}
                className="group rounded-xl border border-gray-200 p-6 transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div
                  className={`inline-flex rounded-lg p-3 ${niche.color}`}
                >
                  <niche.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {niche.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {niche.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything You Need to Convert Visitors
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A complete lead generation platform, not just a chatbot.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {feature.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Go Live in 5 Minutes
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              No coding, no developers, no complexity.
            </p>
          </div>
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              One new client pays for your entire year.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Basic */}
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-gray-900">Basic</h3>
              <p className="mt-1 text-sm text-gray-500">
                For solo practitioners
              </p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$20</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li>1 chatbot</li>
                <li>500 conversations/month</li>
                <li>Knowledge base (FAQs, docs)</li>
                <li>Lead capture forms</li>
                <li>Email notifications</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-lg border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-xl border-2 border-blue-600 bg-white p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
              <p className="mt-1 text-sm text-gray-500">
                For growing practices
              </p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$50</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li>3 chatbots</li>
                <li>Unlimited conversations</li>
                <li>All knowledge types (incl. YouTube)</li>
                <li>Booking wizard</li>
                <li>White-label (remove branding)</li>
                <li>Analytics dashboard</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>

            {/* Agency */}
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-gray-900">Agency</h3>
              <p className="mt-1 text-sm text-gray-500">
                For agencies & teams
              </p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$150</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li>10 chatbots</li>
                <li>Unlimited everything</li>
                <li>White-label</li>
                <li>Team management</li>
                <li>Priority support</li>
                <li>API access</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-lg border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-900">
            Stop Losing 90% of Your Website Visitors
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Your competitors are already using AI chatbots. Every day without
            one is leads lost. Start converting today.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Build Your Chatbot Now — Free
          </Link>
        </div>
      </section>
    </>
  );
}

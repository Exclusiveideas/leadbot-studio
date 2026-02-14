"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scale,
  Target,
  Heart,
  Home,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import type { NicheType, TonePreset } from "@/lib/constants/niches";

const ICON_MAP: Record<string, React.ElementType> = {
  Scale,
  Target,
  Heart,
  Home,
  TrendingUp,
  Sparkles,
};

const NICHE_OPTIONS: {
  id: NicheType;
  name: string;
  tagline: string;
  icon: string;
  color: string;
}[] = [
  {
    id: "LAW_FIRM",
    name: "Law Firm",
    tagline: "Convert visitors into qualified legal leads",
    icon: "Scale",
    color: "#1E40AF",
  },
  {
    id: "BUSINESS_COACH",
    name: "Business Coach",
    tagline: "Turn curious visitors into coaching clients",
    icon: "Target",
    color: "#7C3AED",
  },
  {
    id: "THERAPIST",
    name: "Therapist",
    tagline: "Help people take the first step",
    icon: "Heart",
    color: "#059669",
  },
  {
    id: "REAL_ESTATE",
    name: "Real Estate",
    tagline: "Capture buyer and seller leads 24/7",
    icon: "Home",
    color: "#DC2626",
  },
  {
    id: "FINANCIAL_ADVISOR",
    name: "Financial Advisor",
    tagline: "Build trust and capture high-value leads",
    icon: "TrendingUp",
    color: "#0369A1",
  },
  {
    id: "CUSTOM",
    name: "Custom",
    tagline: "Build for any business or use case",
    icon: "Sparkles",
    color: "#6B7280",
  },
];

const STEPS = [
  "Choose Industry",
  "Business Details",
  "Branding",
  "Integrations",
  "Review",
];

interface OnboardingData {
  nicheType: NicheType | null;
  businessName: string;
  businessDescription: string;
  services: string;
  websiteUrl: string;
  primaryColor: string;
  accentColor: string;
  welcomeMessage: string;
  chatGreeting: string;
  calendlyLink: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    nicheType: null,
    businessName: "",
    businessDescription: "",
    services: "",
    websiteUrl: "",
    primaryColor: "#001F54",
    accentColor: "#3B82F6",
    welcomeMessage: "",
    chatGreeting: "",
    calendlyLink: "",
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return data.nicheType !== null;
      case 1:
        return data.businessName.trim().length > 0;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!data.nicheType) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nicheType: data.nicheType,
          businessName: data.businessName,
          businessDescription: data.businessDescription,
          services: data.services
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          websiteUrl: data.websiteUrl,
          appearance: {
            primaryColor: data.primaryColor,
            accentColor: data.accentColor,
          },
          welcomeMessage: data.welcomeMessage || undefined,
          chatGreeting: data.chatGreeting || undefined,
          calendlyLink: data.calendlyLink || undefined,
        }),
      });

      const result = await res.json();
      if (result.success) {
        router.push(`/chatbots/${result.data.chatbotId}`);
      }
    } catch {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  i < step
                    ? "bg-blue-600 text-white"
                    : i === step
                      ? "border-2 border-blue-600 text-blue-600"
                      : "border border-gray-300 text-gray-400"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-12 sm:w-20 ${
                    i < step ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          {STEPS.map((s) => (
            <span key={s} className="w-16 text-center sm:w-24">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        {/* Step 0: Choose Niche */}
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              What industry is your business in?
            </h2>
            <p className="mt-2 text-gray-600">
              We&apos;ll set up your chatbot with industry-specific defaults.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {NICHE_OPTIONS.map((niche) => {
                const Icon = ICON_MAP[niche.icon];
                const isSelected = data.nicheType === niche.id;
                return (
                  <button
                    key={niche.id}
                    onClick={() => {
                      updateData({ nicheType: niche.id });
                    }}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="inline-flex rounded-lg p-2"
                      style={{
                        backgroundColor: niche.color + "15",
                        color: niche.color,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-gray-900">
                      {niche.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {niche.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Business Details */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Tell us about your business
            </h2>
            <p className="mt-2 text-gray-600">
              This information helps your chatbot represent you accurately.
            </p>
            <div className="mt-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={data.businessName}
                  onChange={(e) =>
                    updateData({ businessName: e.target.value })
                  }
                  placeholder="e.g., Smith & Associates Law Firm"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Description
                </label>
                <textarea
                  value={data.businessDescription}
                  onChange={(e) =>
                    updateData({ businessDescription: e.target.value })
                  }
                  placeholder="Briefly describe what your business does and who you serve..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Services (comma-separated)
                </label>
                <input
                  type="text"
                  value={data.services}
                  onChange={(e) => updateData({ services: e.target.value })}
                  placeholder="e.g., Family Law, Personal Injury, Estate Planning"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Website URL
                </label>
                <input
                  type="url"
                  value={data.websiteUrl}
                  onChange={(e) =>
                    updateData({ websiteUrl: e.target.value })
                  }
                  placeholder="https://www.yourbusiness.com"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Branding */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Customize your chatbot&apos;s look
            </h2>
            <p className="mt-2 text-gray-600">
              Match your brand colors and messaging.
            </p>
            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Primary Color
                  </label>
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      type="color"
                      value={data.primaryColor}
                      onChange={(e) =>
                        updateData({ primaryColor: e.target.value })
                      }
                      className="h-10 w-10 cursor-pointer rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={data.primaryColor}
                      onChange={(e) =>
                        updateData({ primaryColor: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Accent Color
                  </label>
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      type="color"
                      value={data.accentColor}
                      onChange={(e) =>
                        updateData({ accentColor: e.target.value })
                      }
                      className="h-10 w-10 cursor-pointer rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={data.accentColor}
                      onChange={(e) =>
                        updateData({ accentColor: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Welcome Message
                </label>
                <input
                  type="text"
                  value={data.welcomeMessage}
                  onChange={(e) =>
                    updateData({ welcomeMessage: e.target.value })
                  }
                  placeholder="Hi! How can I help you today?"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Leave blank to use the industry default
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Chat Greeting
                </label>
                <input
                  type="text"
                  value={data.chatGreeting}
                  onChange={(e) =>
                    updateData({ chatGreeting: e.target.value })
                  }
                  placeholder="Welcome! What can I help you with?"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Leave blank to use the industry default
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Integrations */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Connect your tools
            </h2>
            <p className="mt-2 text-gray-600">
              Optional integrations to supercharge your chatbot. You can set
              these up later too.
            </p>
            <div className="mt-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Calendly Link
                </label>
                <input
                  type="url"
                  value={data.calendlyLink}
                  onChange={(e) =>
                    updateData({ calendlyLink: e.target.value })
                  }
                  placeholder="https://calendly.com/your-name/consultation"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Visitors can book appointments directly through your chatbot
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  More integrations (Slack, CRM, webhooks) can be configured
                  after creating your chatbot.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Review & Create
            </h2>
            <p className="mt-2 text-gray-600">
              Here&apos;s a summary of your chatbot. You can edit everything
              after creation.
            </p>
            <div className="mt-8 space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Industry
                </div>
                <div className="mt-1 text-sm text-gray-900">
                  {NICHE_OPTIONS.find((n) => n.id === data.nicheType)?.name ||
                    "Custom"}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Business Name
                </div>
                <div className="mt-1 text-sm text-gray-900">
                  {data.businessName}
                </div>
              </div>
              {data.businessDescription && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    Description
                  </div>
                  <div className="mt-1 text-sm text-gray-900">
                    {data.businessDescription}
                  </div>
                </div>
              )}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Colors
                </div>
                <div className="mt-2 flex gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded"
                      style={{ backgroundColor: data.primaryColor }}
                    />
                    <span className="text-xs text-gray-600">
                      {data.primaryColor}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded"
                      style={{ backgroundColor: data.accentColor }}
                    />
                    <span className="text-xs text-gray-600">
                      {data.accentColor}
                    </span>
                  </div>
                </div>
              </div>
              {data.calendlyLink && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    Calendly
                  </div>
                  <div className="mt-1 text-sm text-gray-900">
                    {data.calendlyLink}
                  </div>
                </div>
              )}
            </div>
            <p className="mt-6 text-sm text-gray-500">
              After creating, you can upload knowledge base content, customize
              lead forms, configure the booking wizard, and get your embed
              code.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Create Chatbot
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

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
import {
  PageTransition,
  StaggerList,
  StaggerItem,
} from "@/components/dashboard/PageTransition";
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

  const inputClassName =
    "mt-1 w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm text-brand-primary focus:border-brand-blue focus:ring-1 focus:ring-brand-blue focus:outline-none transition-colors";

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl">
        {/* Progress */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    i < step
                      ? "bg-gradient-accent text-brand-primary"
                      : i === step
                        ? "border-2 border-brand-accent-from text-brand-primary"
                        : "border border-brand-border text-brand-light"
                  }`}
                >
                  {i < step ? (
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-1 sm:mx-2 h-0.5 w-6 sm:w-12 md:w-20 rounded-full transition-colors ${
                      i < step ? "bg-gradient-accent" : "bg-brand-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] sm:text-xs text-brand-muted">
            {STEPS.map((s) => (
              <span key={s} className="w-12 sm:w-16 md:w-24 text-center">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-xl border border-brand-border bg-white p-4 sm:p-6 md:p-8 elevation-1 overflow-hidden relative">
          {/* Accent gradient top line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-accent" />

          {/* Step 0: Choose Niche */}
          {step === 0 && (
            <div>
              <div className="accent-line mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-brand-primary">
                What industry is your business in?
              </h2>
              <p className="mt-2 text-sm sm:text-base text-brand-muted">
                We&apos;ll set up your chatbot with industry-specific defaults.
              </p>
              <StaggerList className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
                {NICHE_OPTIONS.map((niche) => {
                  const Icon = ICON_MAP[niche.icon];
                  const isSelected = data.nicheType === niche.id;
                  return (
                    <StaggerItem key={niche.id}>
                      <button
                        onClick={() => {
                          updateData({ nicheType: niche.id });
                        }}
                        className={`w-full rounded-xl border-2 p-3 sm:p-4 text-left transition-all ${
                          isSelected
                            ? "border-brand-accent-from bg-brand-surface elevation-2"
                            : "border-brand-border hover:border-brand-light hover:elevation-1"
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
                        <h3 className="mt-3 text-sm font-semibold text-brand-primary">
                          {niche.name}
                        </h3>
                        <p className="mt-1 text-xs text-brand-muted">
                          {niche.tagline}
                        </p>
                      </button>
                    </StaggerItem>
                  );
                })}
              </StaggerList>
            </div>
          )}

          {/* Step 1: Business Details */}
          {step === 1 && (
            <div>
              <div className="accent-line mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-brand-primary">
                Tell us about your business
              </h2>
              <p className="mt-2 text-brand-muted">
                This information helps your chatbot represent you accurately.
              </p>
              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-brand-primary">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={data.businessName}
                    onChange={(e) =>
                      updateData({ businessName: e.target.value })
                    }
                    placeholder="e.g., Smith & Associates Law Firm"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-primary">
                    Business Description
                  </label>
                  <textarea
                    value={data.businessDescription}
                    onChange={(e) =>
                      updateData({ businessDescription: e.target.value })
                    }
                    placeholder="Briefly describe what your business does and who you serve..."
                    rows={3}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-primary">
                    Services (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={data.services}
                    onChange={(e) => updateData({ services: e.target.value })}
                    placeholder="e.g., Family Law, Personal Injury, Estate Planning"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-primary">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={data.websiteUrl}
                    onChange={(e) => updateData({ websiteUrl: e.target.value })}
                    placeholder="https://www.yourbusiness.com"
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Branding */}
          {step === 2 && (
            <div>
              <div className="accent-line mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-brand-primary">
                Customize your chatbot&apos;s look
              </h2>
              <p className="mt-2 text-brand-muted">
                Match your brand colors and messaging.
              </p>
              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-primary">
                      Primary Color
                    </label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="color"
                        value={data.primaryColor}
                        onChange={(e) =>
                          updateData({ primaryColor: e.target.value })
                        }
                        className="h-10 w-10 cursor-pointer rounded-lg border border-brand-border"
                      />
                      <input
                        type="text"
                        value={data.primaryColor}
                        onChange={(e) =>
                          updateData({ primaryColor: e.target.value })
                        }
                        className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-primary focus:border-brand-blue focus:ring-1 focus:ring-brand-blue focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-primary">
                      Accent Color
                    </label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="color"
                        value={data.accentColor}
                        onChange={(e) =>
                          updateData({ accentColor: e.target.value })
                        }
                        className="h-10 w-10 cursor-pointer rounded-lg border border-brand-border"
                      />
                      <input
                        type="text"
                        value={data.accentColor}
                        onChange={(e) =>
                          updateData({ accentColor: e.target.value })
                        }
                        className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-primary focus:border-brand-blue focus:ring-1 focus:ring-brand-blue focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-primary">
                    Welcome Message
                  </label>
                  <input
                    type="text"
                    value={data.welcomeMessage}
                    onChange={(e) =>
                      updateData({ welcomeMessage: e.target.value })
                    }
                    placeholder="Hi! How can I help you today?"
                    className={inputClassName}
                  />
                  <p className="mt-1 text-xs text-brand-light">
                    Leave blank to use the industry default
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-primary">
                    Chat Greeting
                  </label>
                  <input
                    type="text"
                    value={data.chatGreeting}
                    onChange={(e) =>
                      updateData({ chatGreeting: e.target.value })
                    }
                    placeholder="Welcome! What can I help you with?"
                    className={inputClassName}
                  />
                  <p className="mt-1 text-xs text-brand-light">
                    Leave blank to use the industry default
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Integrations */}
          {step === 3 && (
            <div>
              <div className="accent-line mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-brand-primary">
                Connect your tools
              </h2>
              <p className="mt-2 text-brand-muted">
                Optional integrations to supercharge your chatbot. You can set
                these up later too.
              </p>
              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-brand-primary">
                    Calendly Link
                  </label>
                  <input
                    type="url"
                    value={data.calendlyLink}
                    onChange={(e) =>
                      updateData({ calendlyLink: e.target.value })
                    }
                    placeholder="https://calendly.com/your-name/consultation"
                    className={inputClassName}
                  />
                  <p className="mt-1 text-xs text-brand-light">
                    Visitors can book appointments directly through your chatbot
                  </p>
                </div>
                <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
                  <p className="text-sm text-brand-muted">
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
              <div className="accent-line mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-brand-primary">
                Review & Create
              </h2>
              <p className="mt-2 text-brand-muted">
                Here&apos;s a summary of your chatbot. You can edit everything
                after creation.
              </p>
              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                <div className="rounded-lg border border-brand-border p-3 sm:p-4">
                  <div className="text-xs font-medium text-brand-muted uppercase tracking-wider">
                    Industry
                  </div>
                  <div className="mt-1 text-sm text-brand-primary font-medium">
                    {NICHE_OPTIONS.find((n) => n.id === data.nicheType)?.name ||
                      "Custom"}
                  </div>
                </div>
                <div className="rounded-lg border border-brand-border p-3 sm:p-4">
                  <div className="text-xs font-medium text-brand-muted uppercase tracking-wider">
                    Business Name
                  </div>
                  <div className="mt-1 text-sm text-brand-primary font-medium">
                    {data.businessName}
                  </div>
                </div>
                {data.businessDescription && (
                  <div className="rounded-lg border border-brand-border p-3 sm:p-4">
                    <div className="text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Description
                    </div>
                    <div className="mt-1 text-sm text-brand-primary">
                      {data.businessDescription}
                    </div>
                  </div>
                )}
                <div className="rounded-lg border border-brand-border p-3 sm:p-4">
                  <div className="text-xs font-medium text-brand-muted uppercase tracking-wider">
                    Colors
                  </div>
                  <div className="mt-2 flex gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-md border border-brand-border"
                        style={{ backgroundColor: data.primaryColor }}
                      />
                      <span className="text-xs text-brand-muted">
                        {data.primaryColor}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-md border border-brand-border"
                        style={{ backgroundColor: data.accentColor }}
                      />
                      <span className="text-xs text-brand-muted">
                        {data.accentColor}
                      </span>
                    </div>
                  </div>
                </div>
                {data.calendlyLink && (
                  <div className="rounded-lg border border-brand-border p-3 sm:p-4">
                    <div className="text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Calendly
                    </div>
                    <div className="mt-1 text-sm text-brand-primary">
                      {data.calendlyLink}
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-6 text-sm text-brand-muted">
                After creating, you can upload knowledge base content, customize
                lead forms, configure the booking wizard, and get your embed
                code.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-4 sm:mt-6 flex justify-between gap-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-secondary flex items-center gap-1.5 sm:gap-2 rounded-lg px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="btn-primary flex items-center gap-1.5 sm:gap-2 rounded-lg px-4 sm:px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-1.5 sm:gap-2 rounded-lg px-4 sm:px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
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
    </PageTransition>
  );
}

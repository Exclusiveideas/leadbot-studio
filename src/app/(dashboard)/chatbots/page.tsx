"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Plus,
  CheckCircle,
  FileText,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  X,
} from "lucide-react";
import {
  PageTransition,
  StaggerList,
  StaggerItem,
} from "@/components/dashboard/PageTransition";
import EmptyState from "@/components/dashboard/EmptyState";
import type { PlanTier } from "@/lib/constants/plans";
import { getChatbotLimit, PLAN_CONFIG } from "@/lib/constants/plans";

type ChatbotListItem = {
  id: string;
  name: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED";
  embedCode: string;
  createdAt: string;
  _count: {
    leads: number;
    knowledgeBase: number;
  };
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
};

export default function ChatbotsPage() {
  const router = useRouter();
  const [chatbots, setChatbots] = useState<ChatbotListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanTier>("BASIC");
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    fetchChatbots();
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.organization?.plan) {
          setPlan(data.user.organization.plan as PlanTier);
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateClick = () => {
    const limit = getChatbotLimit(plan);
    if (chatbots.length >= limit) {
      setShowLimitModal(true);
    } else {
      router.push("/chatbots/new");
    }
  };

  const fetchChatbots = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/chatbots", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch chatbots");
      }

      const result = await response.json();

      if (result.success) {
        setChatbots(result.data.chatbots || []);
      } else {
        throw new Error(result.error || "Failed to load chatbots");
      }
    } catch (err) {
      console.error("Failed to fetch chatbots:", err);
      setError(err instanceof Error ? err.message : "Failed to load chatbots");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-brand-surface rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-brand-surface rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-white rounded-xl border border-brand-border"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchChatbots}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
            <div>
              <div className="accent-line mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-brand-primary">
                Chatbots
              </h1>
              <p className="text-sm sm:text-base text-brand-muted mt-2">
                Create and manage AI chatbots for client intake
              </p>
            </div>
            <button
              onClick={handleCreateClick}
              className="btn-primary inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm self-start sm:self-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Chatbot
            </button>
          </div>

          {/* Empty state */}
          {chatbots.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No chatbots"
              description="Get started by creating your first chatbot."
              action={
                <button
                  onClick={handleCreateClick}
                  className="btn-primary inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Chatbot
                </button>
              }
            />
          ) : (
            /* Chatbots grid */
            <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {chatbots.map((chatbot) => (
                <StaggerItem key={chatbot.id}>
                  <Link
                    href={`/chatbots/${chatbot.id}`}
                    className="group block bg-white rounded-xl border border-brand-border elevation-1 card-hover-lift overflow-hidden"
                  >
                    {/* Accent gradient top line */}
                    <div className="h-0.5 bg-gradient-accent" />
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-brand-primary group-hover:text-brand-secondary transition-colors">
                          {chatbot.name}
                        </h3>
                        {chatbot.status === "PUBLISHED" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-brand-muted">
                            <FileText className="h-3 w-3 mr-1" />
                            Draft
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {chatbot.description && (
                        <p className="text-sm text-brand-muted line-clamp-1 mb-4">
                          {chatbot.description}
                        </p>
                      )}

                      {/* Stats & Arrow */}
                      <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                        <div className="flex items-center gap-4 text-sm text-brand-muted">
                          <span>
                            <span className="font-semibold text-brand-primary">
                              {chatbot._count.leads}
                            </span>{" "}
                            {chatbot._count.leads === 1 ? "lead" : "leads"}
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-brand-light group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </div>
      </div>

      {/* Chatbot Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLimitModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-brand-border shadow-2xl max-w-md w-full mx-4 p-8 text-center">
            <button
              onClick={() => setShowLimitModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-brand-surface transition-colors"
            >
              <X className="h-4 w-4 text-brand-muted" />
            </button>

            <div className="h-14 w-14 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>

            <h3 className="text-xl font-bold text-brand-primary mb-2">
              Chatbot Limit Reached
            </h3>
            <p className="text-sm text-brand-muted leading-relaxed mb-6">
              Your {PLAN_CONFIG[plan].name} plan allows up to{" "}
              {getChatbotLimit(plan)} chatbot
              {getChatbotLimit(plan) > 1 ? "s" : ""}. Upgrade your plan to
              create more chatbots.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/settings?tab=billing"
                className="bg-gradient-accent inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-brand-primary shadow-md hover:shadow-lg transition-all hover:brightness-105"
              >
                Upgrade Plan
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setShowLimitModal(false)}
                className="text-sm font-medium text-brand-muted hover:text-brand-primary transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

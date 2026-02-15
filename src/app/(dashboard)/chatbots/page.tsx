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
} from "lucide-react";
import {
  PageTransition,
  StaggerList,
  StaggerItem,
} from "@/components/dashboard/PageTransition";
import EmptyState from "@/components/dashboard/EmptyState";

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

  useEffect(() => {
    fetchChatbots();
  }, []);

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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold font-heading text-brand-primary">
                Chatbots
              </h1>
              <p className="text-brand-muted mt-2">
                Create and manage AI chatbots for client intake
              </p>
            </div>
            <Link
              href="/chatbots/new"
              className="btn-primary inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Chatbot
            </Link>
          </div>

          {/* Empty state */}
          {chatbots.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No chatbots"
              description="Get started by creating your first chatbot."
              action={
                <Link
                  href="/chatbots/new"
                  className="btn-primary inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Chatbot
                </Link>
              }
            />
          ) : (
            /* Chatbots grid */
            <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </PageTransition>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Calendar, Globe, RefreshCw } from "lucide-react";
import EmptyState from "@/components/dashboard/EmptyState";

type Feedback = {
  id: string;
  sessionId: string;
  subject: string;
  content: string;
  submittedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export default function ChatbotFeedbacksPage() {
  const params = useParams();
  const chatbotId = params.id as string;

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, [chatbotId]);

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/chatbots/${chatbotId}/feedbacks`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feedbacks");
      }

      const result = await response.json();
      if (result.success) {
        setFeedbacks(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedbacks");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchFeedbacks}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No feedback yet"
        description="User feedback will appear here once submitted through the chatbot widget."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <p className="text-sm sm:text-base text-brand-muted">
          {feedbacks.length} feedback{feedbacks.length !== 1 ? "s" : ""}{" "}
          received
        </p>
        <button
          onClick={fetchFeedbacks}
          disabled={isLoading}
          className="btn-secondary inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Reload
        </button>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-xl elevation-1 border border-brand-border overflow-hidden">
        <div className="divide-y divide-brand-border">
          {feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="p-4 sm:p-6 hover:bg-brand-surface/50 transition-colors"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3 mb-3">
                <h3 className="text-sm sm:text-base font-semibold text-brand-primary">
                  {feedback.subject}
                </h3>
                <div className="flex items-center text-xs sm:text-sm text-brand-muted whitespace-nowrap">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {formatDate(feedback.submittedAt)}
                </div>
              </div>

              {/* Content */}
              <p className="text-sm text-brand-secondary whitespace-pre-wrap mb-4">
                {feedback.content}
              </p>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-brand-light">
                <div className="flex items-center">
                  <Globe className="h-3.5 w-3.5 mr-1" />
                  Session: {feedback.sessionId.substring(0, 8)}…
                </div>
                {feedback.ipAddress && <div>IP: {feedback.ipAddress}</div>}
              </div>

              {feedback.userAgent && (
                <div className="mt-2 text-xs text-brand-light truncate">
                  {feedback.userAgent}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

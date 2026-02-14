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
            <div className="h-8 bg-white/70 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-white/70 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-white/70 rounded-lg"></div>
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chatbots</h1>
            <p className="text-gray-600 mt-2">
              Create and manage AI chatbots for client intake
            </p>
          </div>
          <Link
            href="/chatbots/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Chatbot
          </Link>
        </div>

        {/* Empty state */}
        {chatbots.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No chatbots
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first chatbot.
            </p>
            <div className="mt-6">
              <Link
                href="/chatbots/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Chatbot
              </Link>
            </div>
          </div>
        ) : (
          /* Chatbots grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <Link
                key={chatbot.id}
                href={`/chatbots/${chatbot.id}`}
                className="group block bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {chatbot.name}
                    </h3>
                    {chatbot.status === "PUBLISHED" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                        <FileText className="h-3 w-3 mr-1" />
                        Draft
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {chatbot.description && (
                    <p className="text-sm text-gray-500 line-clamp-1 mb-4">
                      {chatbot.description}
                    </p>
                  )}

                  {/* Stats & Arrow */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        <span className="font-medium text-gray-900">
                          {chatbot._count.leads}
                        </span>{" "}
                        {chatbot._count.leads === 1 ? "lead" : "leads"}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

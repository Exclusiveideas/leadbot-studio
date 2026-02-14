"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ChatbotForm from "@/components/chatbots/ChatbotForm";

type Chatbot = {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  persona: string;
  customInstructions: string;
  welcomeMessage: string;
  aiModel: string;
  status: "DRAFT" | "PUBLISHED";
  allowedDomains: string[];
  chatGreeting?: string | null;
  appearance?: Record<string, unknown> | null;
  suggestedQuestions?: string[] | null;
  calendlyLink?: string | null;
  bookingConfig?: Record<string, unknown> | null;
  textConfig?: Record<string, unknown> | null;
};

export default function ChatbotSettingsPage() {
  const params = useParams();
  const chatbotId = params.id as string;

  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChatbot();
  }, [chatbotId]);

  const fetchChatbot = async () => {
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chatbot");
      }

      const result = await response.json();
      if (result.success) {
        setChatbot(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chatbot");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !chatbot) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || "Chatbot not found"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <ChatbotForm initialData={chatbot} isEditing={true} />
    </div>
  );
}

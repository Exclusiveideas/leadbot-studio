"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ChatbotTabs from "./ChatbotTabs";

type ChatbotLayoutClientProps = {
  chatbotId: string;
  chatbotName: string;
  children: ReactNode;
};

export default function ChatbotLayoutClient({
  chatbotId,
  chatbotName,
  children,
}: ChatbotLayoutClientProps) {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/chatbots"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Chatbots
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{chatbotName}</h1>
          <p className="text-gray-600 mt-2">
            Manage your chatbot's configuration and settings
          </p>
        </div>

        {/* Navigation Tabs */}
        <ChatbotTabs chatbotId={chatbotId} />

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}

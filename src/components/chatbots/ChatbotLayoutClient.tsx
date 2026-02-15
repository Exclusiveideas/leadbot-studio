"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ChatbotTabs from "./ChatbotTabs";
import { PageTransition } from "@/components/dashboard/PageTransition";

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
    <PageTransition>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/chatbots"
              className="inline-flex items-center text-sm text-brand-muted hover:text-brand-primary transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Chatbots
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-brand-primary">
              {chatbotName}
            </h1>
            <p className="text-brand-muted mt-2">
              Manage your chatbot&apos;s configuration and settings
            </p>
          </div>

          {/* Navigation Tabs */}
          <ChatbotTabs chatbotId={chatbotId} />

          {/* Page Content */}
          {children}
        </div>
      </div>
    </PageTransition>
  );
}

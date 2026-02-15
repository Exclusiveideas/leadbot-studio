import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ChatbotForm from "@/components/chatbots/ChatbotForm";

export default function NewChatbotPage() {
  return (
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
          <h1 className="text-3xl font-bold font-heading text-brand-primary">
            Create New AI Chatbot
          </h1>
          <p className="text-brand-muted mt-2">
            Set up your AI chatbot&apos;s personality and configuration
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl elevation-1 border border-brand-border p-6">
          <ChatbotForm />
        </div>
      </div>
    </div>
  );
}

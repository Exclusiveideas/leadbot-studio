"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Copy, Check, Code } from "lucide-react";
import {
  EMBED_PLATFORMS,
  getEmbedCodeForPlatform,
  type PlatformId,
} from "@/lib/constants/embed-platforms";

type Chatbot = {
  id: string;
  name: string;
  embedCode: string;
  allowedDomains: string[];
  status: "DRAFT" | "PUBLISHED";
};

export default function EmbedCodePage() {
  const params = useParams();
  const chatbotId = params.id as string;

  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>("html");

  useEffect(() => {
    fetchChatbot();
  }, [chatbotId]);

  const fetchChatbot = async () => {
    try {
      setIsLoading(true);
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

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://app.leadbotstudio.com";
  const embedScript = chatbot
    ? getEmbedCodeForPlatform(selectedPlatform, chatbot.embedCode, appUrl)
    : "";

  const selectedPlatformConfig = EMBED_PLATFORMS.find(
    (p) => p.id === selectedPlatform,
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    setCopied(false);
  }, [selectedPlatform]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (error || !chatbot) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-800">{error || "Chatbot not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Warning */}
      {chatbot.status === "DRAFT" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800">
            This chatbot is in DRAFT mode and won&apos;t appear on your website.
            Publish it in Settings to make it live.
          </p>
        </div>
      )}

      {/* Platform Selector */}
      <div className="bg-white rounded-xl elevation-1 border border-brand-border">
        <div className="border-b border-brand-border">
          <nav className="flex -mb-px overflow-x-auto">
            {EMBED_PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`border-b-2 py-3 sm:py-4 px-3 sm:px-6 text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedPlatform === platform.id
                    ? "border-transparent text-brand-primary tab-active-border"
                    : "border-transparent text-brand-muted hover:border-brand-border hover:text-brand-primary"
                }`}
              >
                {platform.name}
              </button>
            ))}
          </nav>
        </div>
        {selectedPlatformConfig && (
          <div className="p-4 sm:p-6">
            <p className="text-sm text-brand-muted">
              {selectedPlatformConfig.description}
            </p>
          </div>
        )}
      </div>

      {/* Embed Code Section */}
      <div className="bg-white rounded-xl elevation-1 p-4 sm:p-6 border border-brand-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-brand-muted" />
            <h3 className="text-lg font-medium text-brand-primary">
              Installation Code
            </h3>
          </div>
          <button
            onClick={handleCopy}
            className="btn-secondary inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </>
            )}
          </button>
        </div>

        <div className="bg-gray-900 rounded-xl p-3 sm:p-4 overflow-x-auto">
          <pre className="text-xs sm:text-sm text-gray-100 font-mono">
            <code>{embedScript}</code>
          </pre>
        </div>
      </div>

      {/* Installation Instructions */}
      {selectedPlatformConfig && (
        <div className="bg-white rounded-xl elevation-1 p-4 sm:p-6 border border-brand-border">
          <h3 className="text-lg font-medium text-brand-primary mb-4">
            Installation Instructions
          </h3>
          <ol className="space-y-3 sm:space-y-4 text-sm text-brand-muted">
            {selectedPlatformConfig.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center font-medium text-xs">
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>

          {/* Additional Notes */}
          {selectedPlatformConfig.additionalNotes &&
            selectedPlatformConfig.additionalNotes.length > 0 && (
              <div className="mt-6 pt-6 border-t border-brand-border">
                <h4 className="text-sm font-medium text-brand-primary mb-3">
                  Additional Tips
                </h4>
                <ul className="space-y-2 text-sm text-brand-muted">
                  {selectedPlatformConfig.additionalNotes.map((note, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-brand-blue">&#8226;</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      {/* Domain Whitelist */}
      <div className="bg-white rounded-xl elevation-1 p-6 border border-brand-border">
        <h3 className="text-lg font-medium text-brand-primary mb-4">
          Allowed Domains
        </h3>
        <p className="text-sm text-brand-muted mb-4">
          The chatbot will only work on these domains for security:
        </p>
        <div className="space-y-2">
          {chatbot.allowedDomains.map((domain, index) => (
            <div
              key={index}
              className="inline-flex items-center px-3 py-2 bg-brand-surface rounded-lg text-sm text-brand-primary mr-2"
            >
              {domain === "*" ? "All domains (not recommended)" : domain}
            </div>
          ))}
        </div>
        <p className="text-xs text-brand-muted mt-4">
          To update allowed domains, edit the chatbot settings
        </p>
      </div>
    </div>
  );
}

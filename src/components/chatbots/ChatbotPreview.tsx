"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCw, MonitorSmartphone } from "lucide-react";

type ChatbotPreviewProps = {
  embedCode: string;
  name: string;
  status: "DRAFT" | "PUBLISHED";
};

declare global {
  interface Window {
    LeadBotStudio?: {
      init: (config: { chatbotId: string; position?: string }) => void;
    };
  }
}

function cleanupWidget() {
  // Remove widget DOM elements
  document.getElementById("lbs-chat-widget")?.remove();
  document.getElementById("lbs-toast-container")?.remove();

  // Remove widget styles (injected style tags)
  document.querySelectorAll("style").forEach((el) => {
    if (
      el.textContent?.includes("lbs-chat") ||
      el.textContent?.includes("lbs-icon-bounce") ||
      el.textContent?.includes("widget-thinking")
    ) {
      el.remove();
    }
  });

  // Remove widget script
  document
    .querySelectorAll('script[src*="widget.min.js"]')
    .forEach((el) => el.remove());

  // Clear global
  delete window.LeadBotStudio;
}

function loadWidget(embedCode: string) {
  const script = document.createElement("script");
  script.src = `/widget.min.js?v=${Date.now()}`;
  script.onload = () => {
    window.LeadBotStudio?.init({
      chatbotId: embedCode,
      position: "bottom-right",
    });
  };
  document.body.appendChild(script);
}

export function ChatbotPreview({
  embedCode,
  name,
  status,
}: ChatbotPreviewProps) {
  const [widgetKey, setWidgetKey] = useState(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    loadWidget(embedCode);

    return () => {
      cleanupWidget();
      initializedRef.current = false;
    };
  }, [embedCode]);

  // Handle reload
  useEffect(() => {
    if (widgetKey === 0) return;

    cleanupWidget();
    initializedRef.current = false;

    // Small delay to ensure cleanup completes
    const timer = setTimeout(() => {
      loadWidget(embedCode);
      initializedRef.current = true;
    }, 100);

    return () => clearTimeout(timer);
  }, [widgetKey, embedCode]);

  return (
    <div className="bg-dot-grid rounded-xl p-4 sm:p-6 min-h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="h-5 w-5 text-brand-muted" />
          <h2 className="text-lg font-medium text-brand-primary">
            Test Your Chatbot
          </h2>
          {status === "DRAFT" && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              Draft
            </span>
          )}
        </div>
        <button
          onClick={() => setWidgetKey((k) => k + 1)}
          className="btn-secondary inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
        >
          <RotateCw className="h-4 w-4" />
          Reload Preview
        </button>
      </div>
      <p className="text-sm text-brand-muted">
        Live preview of <strong>{name}</strong> — interact with your chatbot
        exactly as visitors will see it. Reload after saving settings changes.
      </p>
    </div>
  );
}

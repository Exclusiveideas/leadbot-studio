"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

type Tab = {
  id: string;
  name: string;
  href: string;
};

type ChatbotTabsProps = {
  chatbotId: string;
};

export default function ChatbotTabs({ chatbotId }: ChatbotTabsProps) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { id: "settings", name: "Settings", href: `/chatbots/${chatbotId}` },
    { id: "chat", name: "Chat", href: `/chatbots/${chatbotId}/chat` },
    {
      id: "knowledge",
      name: "Knowledge Base",
      href: `/chatbots/${chatbotId}/knowledge`,
    },
    { id: "embed", name: "Embed Code", href: `/chatbots/${chatbotId}/embed` },
    { id: "leads", name: "Leads", href: `/chatbots/${chatbotId}/leads` },
    {
      id: "bookings",
      name: "Bookings",
      href: `/chatbots/${chatbotId}/bookings`,
    },
    {
      id: "feedbacks",
      name: "Feedbacks",
      href: `/chatbots/${chatbotId}/feedbacks`,
    },
    {
      id: "analytics",
      name: "Analytics",
      href: `/chatbots/${chatbotId}/analytics`,
    },
  ];

  const isActiveTab = (href: string) => {
    if (href === `/chatbots/${chatbotId}`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="border-b border-brand-border mb-6">
      <nav className="-mb-px flex space-x-4 sm:space-x-6 md:space-x-8 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const active = isActiveTab(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative whitespace-nowrap border-b-2 py-3 sm:py-4 px-1 text-sm font-medium transition-colors duration-150 ${
                active
                  ? "border-transparent text-brand-primary"
                  : "border-transparent text-brand-muted hover:text-brand-primary hover:border-brand-border"
              }`}
            >
              {tab.name}
              {active && (
                <motion.div
                  layoutId="chatbot-tab-indicator"
                  className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gradient-accent rounded-full"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  ];

  const isActiveTab = (href: string) => {
    if (href === `/chatbots/${chatbotId}`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const active = isActiveTab(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors duration-150 ${
                active
                  ? "border-emerald-600 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PublicChatbotWidget } from "@/components/chatbots/widget";
import type { BookingConfig } from "@/lib/validation/chatbot-booking";
import type { TextConfig } from "@/lib/validation/chatbot-text";

// Disable caching to ensure fresh data on every request
export const dynamic = "force-dynamic";

interface PublicChatbotPageProps {
  params: Promise<{
    embedCode: string;
  }>;
}

export default async function PublicChatbotPage({
  params,
}: PublicChatbotPageProps) {
  const { embedCode } = await params;

  // Fetch chatbot by embedCode (server-side)
  // Allow both PUBLISHED and DRAFT for preview purposes
  const chatbot = await prisma.chatbot.findUnique({
    where: { embedCode },
    select: {
      id: true,
      name: true,
      thumbnail: true,
      welcomeMessage: true,
      chatGreeting: true,
      suggestedQuestions: true,
      bookingConfig: true,
      textConfig: true,
      appearance: true,
      status: true,
    },
  });

  if (!chatbot) {
    notFound();
  }

  // Parse appearance, bookingConfig, and textConfig from JSON
  const appearance = chatbot.appearance as {
    primaryColor?: string;
    accentColor?: string;
  } | null;

  const bookingConfig = chatbot.bookingConfig as BookingConfig | null;
  const textConfig = chatbot.textConfig as TextConfig | null;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{chatbot.name}</title>
      </head>
      <body style={{ margin: 0, padding: 0, overflow: "hidden" }}>
        <PublicChatbotWidget
          chatbot={{
            id: chatbot.id,
            name: chatbot.name,
            thumbnail: chatbot.thumbnail,
            welcomeMessage: chatbot.welcomeMessage,
            chatGreeting: chatbot.chatGreeting,
            suggestedQuestions: chatbot.suggestedQuestions as
              | string[]
              | undefined,
            bookingConfig,
            textConfig,
            appearance,
          }}
          isEmbedded={false}
        />
      </body>
    </html>
  );
}

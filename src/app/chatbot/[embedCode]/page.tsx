import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PublicChatbotWidget } from "@/components/chatbots/widget";
import { DraftChatbotNotice } from "@/components/chatbots/DraftChatbotNotice";
import { getSignedDownloadUrl } from "@/lib/storage/aws-server";
import type { BookingConfig } from "@/lib/validation/chatbot-booking";
import type { TextConfig } from "@/lib/validation/chatbot-text";

// Disable caching to ensure fresh data on every request
export const dynamic = "force-dynamic";

interface PublicChatbotPageProps {
  params: Promise<{
    embedCode: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PublicChatbotPage({
  params,
  searchParams,
}: PublicChatbotPageProps) {
  const { embedCode } = await params;
  const resolvedSearchParams = await searchParams;
  const isPreview = resolvedSearchParams.preview === "true";

  // Fetch chatbot by embedCode (server-side)
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

  // Block DRAFT chatbots unless accessed via dashboard preview
  if (chatbot.status === "DRAFT" && !isPreview) {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{chatbot.name}</title>
        </head>
        <body style={{ margin: 0, padding: 0 }}>
          <DraftChatbotNotice chatbotName={chatbot.name} />
        </body>
      </html>
    );
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
            thumbnail: chatbot.thumbnail
              ? await getSignedDownloadUrl(chatbot.thumbnail)
              : null,
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

import { getServerSession } from "@/lib/auth/server-session";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ChatbotPreview } from "@/components/chatbots/ChatbotPreview";

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChatbotChatPage({ params }: ChatPageProps) {
  const sessionData = await getServerSession();

  if (!sessionData) {
    redirect("/login");
  }

  const { id } = await params;

  const chatbot = await prisma.chatbot.findUnique({
    where: { id },
    select: {
      name: true,
      embedCode: true,
      status: true,
    },
  });

  if (!chatbot) {
    notFound();
  }

  return (
    <ChatbotPreview
      embedCode={chatbot.embedCode}
      name={chatbot.name}
      status={chatbot.status as "DRAFT" | "PUBLISHED"}
    />
  );
}

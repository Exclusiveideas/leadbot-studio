import { getServerSession } from "@/lib/auth/server-session";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ChatbotChatTabbed } from "@/components/chatbots/ChatbotChatTabbed";

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

  // Await params (Next.js 15 requirement)
  const { id } = await params;

  // Get chatbot details
  // Note: Access control is handled by the layout
  const chatbot = await prisma.chatbot.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      welcomeMessage: true,
    },
  });

  if (!chatbot) {
    notFound();
  }

  return (
    <ChatbotChatTabbed
      chatbot={{
        id: chatbot.id,
        name: chatbot.name,
        welcomeMessage: chatbot.welcomeMessage,
      }}
      userId={sessionData.user.id}
    />
  );
}

import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server-session";
import { prisma } from "@/lib/db";
import ChatbotLayoutClient from "@/components/chatbots/ChatbotLayoutClient";

type ChatbotLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export default async function ChatbotLayout({
  children,
  params,
}: ChatbotLayoutProps) {
  const sessionData = await getServerSession();

  if (!sessionData) {
    redirect("/login");
  }

  // Await params (Next.js 15)
  const { id } = await params;

  // Fetch chatbot data once in the layout
  const chatbot = await prisma.chatbot.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      organizationId: true,
      createdBy: true,
    },
  });

  if (!chatbot) {
    notFound();
  }

  // Verify user has access to this chatbot
  // User has access if they are the creator OR belong to the same organization
  const isCreator = sessionData.user.id === chatbot.createdBy;

  if (!isCreator && chatbot.organizationId) {
    if (sessionData.user.organization?.id !== chatbot.organizationId) {
      notFound();
    }
  }

  return (
    <ChatbotLayoutClient chatbotId={chatbot.id} chatbotName={chatbot.name}>
      {children}
    </ChatbotLayoutClient>
  );
}

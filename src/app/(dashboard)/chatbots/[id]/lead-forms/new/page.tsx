import { getServerSession } from "@/lib/auth/server-session";
import { getChatbot } from "@/lib/services/chatbotService";
import { redirect } from "next/navigation";
import { LeadFormBuilder } from "@/components/chatbots/lead-forms/LeadFormBuilder";

export default async function NewLeadFormPage({
  params,
}: {
  params: { id: string };
}) {
  const sessionData = await getServerSession();
  if (!sessionData) {
    redirect("/login");
  }

  const chatbot = await getChatbot(params.id);
  if (!chatbot) {
    redirect("/chatbots");
  }

  // Check ownership
  if (
    chatbot.createdBy !== sessionData.user.id &&
    chatbot.organizationId !== sessionData.user.organization?.id
  ) {
    redirect("/chatbots");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Lead Form</h1>
        <p className="text-sm text-gray-500 mt-1">
          Build a custom lead capture form for {chatbot.name}
        </p>
      </div>

      <LeadFormBuilder chatbotId={params.id} />
    </div>
  );
}

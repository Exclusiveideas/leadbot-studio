import { getServerSession } from "@/lib/auth/server-session";
import { getChatbot } from "@/lib/services/chatbotService";
import { chatbotLeadFormService } from "@/lib/services/chatbotLeadFormService";
import { redirect } from "next/navigation";
import { LeadFormBuilder } from "@/components/chatbots/lead-forms/LeadFormBuilder";

export default async function EditLeadFormPage({
  params,
}: {
  params: { id: string; formId: string };
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

  const form = await chatbotLeadFormService.getForm(params.formId);
  if (!form || form.chatbot.id !== params.id) {
    redirect(`/chatbots/${params.id}/lead-forms`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Lead Form</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update the lead capture form for {chatbot.name}
        </p>
      </div>

      <LeadFormBuilder
        chatbotId={params.id}
        initialData={{
          id: form.id,
          name: form.name,
          description: form.description || undefined,
          fields: form.fields as any[],
          appearance: form.appearance as any,
          behavior: form.behavior as any,
          isDefault: form.isDefault,
          isActive: form.isActive,
        }}
        isEditing
      />
    </div>
  );
}

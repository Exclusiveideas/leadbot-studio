import { getServerSession } from "@/lib/auth/server-session";
import { getChatbot } from "@/lib/services/chatbotService";
import { chatbotLeadFormService } from "@/lib/services/chatbotLeadFormService";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ChatbotLeadFormsPage({
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

  if (
    chatbot.createdBy !== sessionData.user.id &&
    chatbot.organizationId !== sessionData.user.organization?.id
  ) {
    redirect("/chatbots");
  }

  const forms = await chatbotLeadFormService.listForms(params.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Lead Forms</h1>
          <p className="text-sm text-brand-muted mt-1">
            Create and manage custom lead capture forms for your chatbot
          </p>
        </div>
        <Link
          href={`/chatbots/${params.id}/lead-forms/new`}
          className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Form
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-brand-border p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-brand-surface rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-brand-light"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-brand-primary mb-2">
            No forms created yet
          </h3>
          <p className="text-brand-muted mb-6 max-w-md mx-auto">
            Create custom lead capture forms with drag-and-drop field builder.
            Choose from pre-built templates or start from scratch.
          </p>
          <Link
            href={`/chatbots/${params.id}/lead-forms/new`}
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Your First Form
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-xl border border-brand-border elevation-1 p-6 hover:border-brand-blue/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-brand-primary">
                      {form.name}
                    </h3>
                    {form.isDefault && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">
                        Default
                      </span>
                    )}
                    {!form.isActive && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  {form.description && (
                    <p className="text-sm text-brand-muted mt-1">
                      {form.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-brand-muted">
                    <span>
                      {(form.fields as any[]).length} field
                      {(form.fields as any[]).length !== 1 ? "s" : ""}
                    </span>
                    <span>&#8226;</span>
                    <span>
                      {form._count.leads} lead
                      {form._count.leads !== 1 ? "s" : ""} captured
                    </span>
                  </div>
                </div>

                <Link
                  href={`/chatbots/${params.id}/lead-forms/${form.id}/edit`}
                  className="btn-secondary px-4 py-2 text-sm rounded-lg"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { X } from "lucide-react";
import type { FormField } from "@/lib/validation/chatbot-lead-form";
import { DynamicLeadCaptureForm } from "../DynamicLeadCaptureForm";

interface FormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formName: string;
  fields: FormField[];
  appearance?: {
    primaryColor: string;
    accentColor: string;
    buttonText: string;
  };
  behavior?: {
    showSuccessMessage?: boolean;
    successMessage?: string;
    redirectUrl?: string;
    multiStep?: {
      enabled: boolean;
      steps: Array<{
        title: string;
        description?: string;
      }>;
    };
  };
  successMessage?: string;
}

export function FormPreviewModal({
  isOpen,
  onClose,
  formName,
  fields,
  appearance,
  behavior,
  successMessage,
}: FormPreviewModalProps) {
  if (!isOpen) return null;

  const handlePreviewSubmit = async () => {
    // Preview mode - don't actually submit
    return Promise.resolve();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Form Preview
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Preview how your form will appear to users
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Preview Mode:</strong> This is how your form will appear
              in the chatbot. Form submission is disabled in preview mode.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            {fields.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No fields added yet. Add fields to see the preview.
                </p>
              </div>
            ) : (
              <DynamicLeadCaptureForm
                fields={fields}
                appearance={appearance}
                behavior={behavior}
                successMessage={successMessage}
                chatbotName={formName || "Preview Chatbot"}
                onSubmit={handlePreviewSubmit}
                previewMode={true}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

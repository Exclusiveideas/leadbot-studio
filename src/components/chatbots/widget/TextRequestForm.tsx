"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Phone } from "lucide-react";
import {
  createTextRequestSchema,
  type TextConfig,
} from "@/lib/validation/chatbot-text";

type TextRequestFormProps = {
  chatbotId: string;
  config: TextConfig;
  onBack: () => void;
  onComplete: () => void;
  primaryColor?: string;
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

const INITIAL_FORM_DATA: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
};

export default function TextRequestForm({
  chatbotId,
  config,
  onBack,
  onComplete,
  primaryColor = "#001F54",
}: TextRequestFormProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = config.fields || {};
  const firstNameRequired = fields.firstName?.required !== false;
  const lastNameRequired = fields.lastName?.required !== false;
  const phoneRequired = fields.phone?.required !== false;
  const emailEnabled = fields.email?.enabled !== false;
  const emailRequired = fields.email?.required === true;
  const messageRequired = fields.message?.required !== false;

  const consentText =
    config.consentText ||
    "By submitting this form, you consent to receive text messages from us. Message and data rates may apply.";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validate = (): string | null => {
    const schema = createTextRequestSchema(config);
    const result = schema.safeParse({
      sessionId: "validation-check",
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      message: formData.message.trim(),
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      return firstError?.message || "Validation failed";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const sessionId =
        Date.now().toString(36) + Math.random().toString(36).substring(2, 15);

      const response = await fetch(
        `/api/public/chatbots/${chatbotId}/text-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim() || undefined,
            message: formData.message.trim(),
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit text request");
      }

      onComplete();
    } catch (err) {
      console.error("Text request submission error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send message. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div
        className="p-4 text-white flex items-center gap-3"
        style={{ backgroundColor: primaryColor }}
      >
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          <h2 className="font-semibold">Send us a Text</h2>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* First Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name{firstNameRequired && " *"}
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="John"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name{lastNameRequired && " *"}
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Doe"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number{phoneRequired && " *"}
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Email (conditional) */}
          {emailEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email{emailRequired && " *"}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message{messageRequired && " *"}
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="How can we help you?"
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Consent Text */}
          <p className="text-xs text-gray-500 leading-relaxed">{consentText}</p>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="p-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 rounded-xl font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Message"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

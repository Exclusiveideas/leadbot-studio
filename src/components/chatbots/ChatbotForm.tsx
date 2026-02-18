"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  AlertCircle,
  ImageIcon,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  CHATBOT_FORM_VALIDATION,
  CHATBOT_FILE_UPLOAD,
} from "@/lib/constants/chatbot";
import {
  countWords,
  validateThumbnailUpload,
} from "@/lib/utils/validation-helpers";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BookingConfigSection from "./BookingConfigSection";
import TextConfigSection from "./TextConfigSection";
import PlanGate, { useOrganizationPlan } from "@/components/shared/PlanGate";
import { hasFeature } from "@/lib/constants/plans";
import type { BookingConfig } from "@/lib/validation/chatbot-booking";
import type { TextConfig } from "@/lib/validation/chatbot-text";

const chatbotSchema = z.object({
  name: z
    .string()
    .min(
      CHATBOT_FORM_VALIDATION.NAME_MIN_LENGTH,
      `Name must be at least ${CHATBOT_FORM_VALIDATION.NAME_MIN_LENGTH} characters`,
    )
    .max(
      CHATBOT_FORM_VALIDATION.NAME_MAX_LENGTH,
      `Name must be less than ${CHATBOT_FORM_VALIDATION.NAME_MAX_LENGTH} characters`,
    ),
  description: z
    .string()
    .min(
      CHATBOT_FORM_VALIDATION.DESCRIPTION_MIN_LENGTH,
      `Description must be at least ${CHATBOT_FORM_VALIDATION.DESCRIPTION_MIN_LENGTH} characters`,
    )
    .max(
      CHATBOT_FORM_VALIDATION.DESCRIPTION_MAX_LENGTH,
      `Description must be less than ${CHATBOT_FORM_VALIDATION.DESCRIPTION_MAX_LENGTH} characters`,
    )
    .refine(
      (val) => countWords(val) >= CHATBOT_FORM_VALIDATION.DESCRIPTION_MIN_WORDS,
      `Description must be at least ${CHATBOT_FORM_VALIDATION.DESCRIPTION_MIN_WORDS} words`,
    )
    .refine(
      (val) => countWords(val) <= CHATBOT_FORM_VALIDATION.DESCRIPTION_MAX_WORDS,
      `Description must be at most ${CHATBOT_FORM_VALIDATION.DESCRIPTION_MAX_WORDS} words`,
    ),
  persona: z
    .string()
    .min(
      CHATBOT_FORM_VALIDATION.PERSONA_MIN_LENGTH,
      `Persona must be at least ${CHATBOT_FORM_VALIDATION.PERSONA_MIN_LENGTH} characters`,
    )
    .max(
      CHATBOT_FORM_VALIDATION.PERSONA_MAX_LENGTH,
      `Persona must be less than ${CHATBOT_FORM_VALIDATION.PERSONA_MAX_LENGTH} characters`,
    ),
  customInstructions: z
    .string()
    .min(
      CHATBOT_FORM_VALIDATION.INSTRUCTIONS_MIN_LENGTH,
      `Custom instructions must be at least ${CHATBOT_FORM_VALIDATION.INSTRUCTIONS_MIN_LENGTH} characters`,
    )
    .max(
      CHATBOT_FORM_VALIDATION.INSTRUCTIONS_MAX_LENGTH,
      `Custom instructions must be less than ${CHATBOT_FORM_VALIDATION.INSTRUCTIONS_MAX_LENGTH} characters`,
    ),
  allowedDomains: z.array(z.string()).min(1, "At least one domain is required"),
});

type ChatbotFormData = z.infer<typeof chatbotSchema>;

type ChatbotFormProps = {
  initialData?: Partial<ChatbotFormData> & {
    id?: string;
    thumbnail?: string | null;
    status?: "DRAFT" | "PUBLISHED";
  };
  isEditing?: boolean;
};

const TAB_FIELD_MAP: Record<string, Array<keyof ChatbotFormData>> = {
  general: ["name", "description"],
  "ai-behavior": ["persona", "customInstructions"],
  security: ["allowedDomains"],
};

export default function ChatbotForm({
  initialData,
  isEditing = false,
}: ChatbotFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.thumbnail || null,
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [domainsInput, setDomainsInput] = useState(
    initialData?.allowedDomains?.join(", ") || "*",
  );
  const [chatbotStatus, setChatbotStatus] = useState<"DRAFT" | "PUBLISHED">(
    initialData?.status || "DRAFT",
  );
  const plan = useOrganizationPlan();
  const canPublish = hasFeature(plan, "publish_chatbot");

  const [chatGreeting, setChatGreeting] = useState(
    (initialData as any)?.chatGreeting ||
      "Hey, Let's get started! What's your goal? How can I help?",
  );
  const [primaryColor, setPrimaryColor] = useState(() => {
    try {
      const appearance = (initialData as any)?.appearance;
      if (typeof appearance === "string") {
        return JSON.parse(appearance).primaryColor || "#001F54";
      }
      return appearance?.primaryColor || "#001F54";
    } catch {
      return "#001F54";
    }
  });
  const [accentColor, setAccentColor] = useState(() => {
    try {
      const appearance = (initialData as any)?.appearance;
      if (typeof appearance === "string") {
        return JSON.parse(appearance).accentColor || "#3B82F6";
      }
      return appearance?.accentColor || "#3B82F6";
    } catch {
      return "#3B82F6";
    }
  });
  const [animationEnabled, setAnimationEnabled] = useState(() => {
    try {
      const appearance = (initialData as any)?.appearance;
      if (typeof appearance === "string") {
        const parsed = JSON.parse(appearance);
        return parsed.animationEnabled ?? true;
      }
      return appearance?.animationEnabled ?? true;
    } catch {
      return true;
    }
  });
  const [animationCycles, setAnimationCycles] = useState(() => {
    try {
      const appearance = (initialData as any)?.appearance;
      if (typeof appearance === "string") {
        const parsed = JSON.parse(appearance);
        return parsed.animationCycles ?? 6;
      }
      return appearance?.animationCycles ?? 6;
    } catch {
      return 6;
    }
  });
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    (initialData as any)?.suggestedQuestions || [],
  );
  const [newQuestion, setNewQuestion] = useState("");
  const [bookingConfig, setBookingConfig] = useState<BookingConfig>(() => {
    try {
      const config = (initialData as any)?.bookingConfig;
      if (typeof config === "string") {
        return JSON.parse(config);
      }
      return (
        config || {
          enabled: false,
          categories: [],
          locations: [],
          requireCaseDescription: true,
        }
      );
    } catch {
      return {
        enabled: false,
        categories: [],
        locations: [],
        requireCaseDescription: true,
      };
    }
  });
  const [textConfig, setTextConfig] = useState<TextConfig>(() => {
    try {
      const config = (initialData as any)?.textConfig;
      if (typeof config === "string") {
        return JSON.parse(config);
      }
      return (
        config || {
          enabled: false,
          consentText: "",
          fields: {
            firstName: { required: true },
            lastName: { required: true },
            phone: { required: true },
            email: { enabled: true, required: false },
            message: { required: true },
          },
        }
      );
    } catch {
      return {
        enabled: false,
        consentText: "",
        fields: {
          firstName: { required: true },
          lastName: { required: true },
          phone: { required: true },
          email: { enabled: true, required: false },
          message: { required: true },
        },
      };
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ChatbotFormData>({
    resolver: zodResolver(chatbotSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      persona: initialData?.persona || "",
      customInstructions: initialData?.customInstructions || "",
      allowedDomains: initialData?.allowedDomains || ["*"],
    },
    mode: "onChange",
  });

  const description = watch("description");
  const descriptionWordCount = countWords(description || "");

  useEffect(() => {
    const errorFields = Object.keys(errors) as Array<keyof typeof errors>;
    if (errorFields.length > 0) {
      const firstErrorField = errorFields[0];
      const firstError = errors[firstErrorField];
      if (firstError?.message) {
        toast.error("Validation Error", {
          description: firstError.message,
        });

        for (const [tab, fields] of Object.entries(TAB_FIELD_MAP)) {
          if (fields.includes(firstErrorField as keyof ChatbotFormData)) {
            setActiveTab(tab);
            break;
          }
        }
      }
    }
  }, [errors]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setThumbnailError(null);
    setImageLoadError(false);

    if (file) {
      const validation = validateThumbnailUpload(
        file,
        CHATBOT_FILE_UPLOAD.MAX_THUMBNAIL_SIZE_BYTES,
        CHATBOT_FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
      );

      if (!validation.valid) {
        setThumbnailError(validation.error!);
        toast.error("File Upload Error", {
          description: validation.error!,
        });
        return;
      }

      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
        setImageLoadError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ChatbotFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const domains = domainsInput
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      if (domains.length === 0) {
        throw new Error("At least one domain is required");
      }

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("persona", data.persona);
      formData.append("customInstructions", data.customInstructions);
      formData.append("chatGreeting", chatGreeting);
      formData.append("aiModel", "claude-3-5-haiku");
      formData.append("allowedDomains", JSON.stringify(domains));
      formData.append(
        "appearance",
        JSON.stringify({
          primaryColor,
          accentColor,
          animationEnabled,
          animationCycles,
        }),
      );
      formData.append("suggestedQuestions", JSON.stringify(suggestedQuestions));
      formData.append("bookingConfig", JSON.stringify(bookingConfig));
      formData.append("textConfig", JSON.stringify(textConfig));

      if (isEditing) {
        formData.append("status", chatbotStatus);
      }

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      const url = isEditing
        ? `/api/chatbots/${initialData?.id}`
        : "/api/chatbots";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save chatbot");
      }

      const result = await response.json();

      toast.success(
        isEditing
          ? "Chatbot updated successfully!"
          : "Chatbot created successfully!",
      );

      router.push(`/chatbots/${result.data.id}`);
      router.refresh();
    } catch (err) {
      console.error("Error saving chatbot:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save chatbot";
      setError(errorMessage);
      toast.error(
        isEditing ? "Failed to update chatbot" : "Failed to create chatbot",
        {
          description: errorMessage,
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium">Error saving chatbot</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="general"
      >
        <TabsList className="mb-6 overflow-x-auto">
          <TabsTrigger value="general" disabled={isSubmitting}>
            General
          </TabsTrigger>
          <TabsTrigger value="ai-behavior" disabled={isSubmitting}>
            AI Behavior
          </TabsTrigger>
          <TabsTrigger value="appearance" disabled={isSubmitting}>
            Appearance
          </TabsTrigger>
          <TabsTrigger value="lead-capture" disabled={isSubmitting}>
            Lead Capture
          </TabsTrigger>
          <TabsTrigger value="security" disabled={isSubmitting}>
            Security
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-brand-secondary mb-2">
              Thumbnail (Optional)
            </label>
            <div className="flex items-center gap-4">
              {thumbnailPreview && !imageLoadError ? (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-2 border-brand-border bg-brand-surface flex items-center justify-center">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                    onError={() => setImageLoadError(true)}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-brand-surface flex items-center justify-center text-brand-light border-2 border-brand-border">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
              <div>
                <label
                  htmlFor="thumbnail"
                  className={`inline-flex text-black items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-brand-surface transition-colors ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </label>
                <input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
                <p className="text-xs text-brand-muted mt-2">
                  JPG, PNG or GIF. Max{" "}
                  {CHATBOT_FILE_UPLOAD.MAX_THUMBNAIL_SIZE_MB}
                  MB.
                </p>
              </div>
            </div>
            {thumbnailError && (
              <p className="text-red-600 text-sm mt-1">{thumbnailError}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-brand-secondary mb-2"
            >
              Chatbot Name *
            </label>
            <input
              {...register("name")}
              type="text"
              id="name"
              placeholder="e.g., Client Intake Bot"
              disabled={isSubmitting}
              className="w-full text-gray-900 px-4 py-2 border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-brand-secondary mb-2"
            >
              Description *
            </label>
            <textarea
              {...register("description")}
              id="description"
              rows={6}
              placeholder="Description of what this chatbot helps with..."
              disabled={isSubmitting}
              className="w-full text-gray-900 px-4 py-2 border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed resize-y"
            />
            <div className="flex justify-between items-center mt-1">
              <div>
                {errors.description && (
                  <p className="text-red-600 text-sm">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <p
                className={`text-sm ${
                  descriptionWordCount >
                  CHATBOT_FORM_VALIDATION.DESCRIPTION_MAX_WORDS
                    ? "text-red-600 font-semibold"
                    : "text-brand-muted"
                }`}
              >
                {descriptionWordCount} /{" "}
                {CHATBOT_FORM_VALIDATION.DESCRIPTION_MAX_WORDS} words
              </p>
            </div>
          </div>

          {/* Publishing Status (Edit Mode Only) */}
          {isEditing && (
            <div className="border-t border-brand-border pt-6">
              <h4 className="text-sm font-medium text-brand-secondary mb-3">
                Publishing Status
              </h4>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={chatbotStatus === "DRAFT"}
                    onChange={() => setChatbotStatus("DRAFT")}
                    disabled={isSubmitting}
                    className="w-4 h-4 text-brand-blue focus:ring-brand-blue"
                  />
                  <span className="text-sm text-brand-secondary">
                    Draft (Not visible to public)
                  </span>
                </label>
                <label
                  className={`flex items-center gap-2 ${canPublish ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                >
                  <input
                    type="radio"
                    name="status"
                    checked={chatbotStatus === "PUBLISHED"}
                    onChange={() => setChatbotStatus("PUBLISHED")}
                    disabled={isSubmitting || !canPublish}
                    className="w-4 h-4 text-brand-blue focus:ring-brand-blue"
                  />
                  <span className="text-sm text-brand-secondary">
                    Published (Live and visible)
                  </span>
                </label>
              </div>
              {!canPublish && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Upgrade to a paid plan to publish your chatbot.
                  </p>
                  <Link
                    href="/settings?tab=billing"
                    className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg bg-gradient-accent px-3 py-1.5 text-xs font-semibold text-brand-primary shadow-sm hover:brightness-105 transition-all"
                  >
                    Upgrade
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* AI Behavior Tab */}
        <TabsContent value="ai-behavior" className="space-y-6">
          {/* Persona */}
          <div>
            <label
              htmlFor="persona"
              className="block text-sm font-medium text-brand-secondary mb-2"
            >
              AI Personality/Persona *
            </label>
            <textarea
              {...register("persona")}
              id="persona"
              rows={4}
              placeholder="Describe the AI's personality, tone, and communication style. e.g., 'You are a friendly and knowledgeable legal assistant who explains concepts clearly...'"
              disabled={isSubmitting}
              className="w-full text-gray-900 px-4 py-2 border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.persona && (
              <p className="text-red-600 text-sm mt-1">
                {errors.persona.message}
              </p>
            )}
            <p className="text-xs text-brand-muted mt-1">
              This defines how the AI will interact with users
            </p>
          </div>

          {/* Custom Instructions */}
          <div>
            <label
              htmlFor="customInstructions"
              className="block text-sm font-medium text-brand-secondary mb-2"
            >
              Custom Instructions *
            </label>
            <textarea
              {...register("customInstructions")}
              id="customInstructions"
              rows={4}
              placeholder="Additional instructions for the AI chatbot. What should it focus on? What should it avoid? Any specific guidelines?"
              disabled={isSubmitting}
              className="w-full text-gray-900 px-4 py-2 border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.customInstructions && (
              <p className="text-red-600 text-sm mt-1">
                {errors.customInstructions.message}
              </p>
            )}
          </div>

          {/* Chat Opener (formerly Chat Greeting) */}
          <div>
            <label
              htmlFor="chatGreeting"
              className="block text-sm font-medium text-brand-secondary mb-2"
            >
              Chat Opener (Optional)
            </label>
            <input
              type="text"
              id="chatGreeting"
              value={chatGreeting}
              onChange={(e) => setChatGreeting(e.target.value)}
              placeholder="Hey, Let's get started! What's your goal? How can I help?"
              disabled={isSubmitting}
              maxLength={200}
              className="w-full text-gray-900 px-4 py-2 border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-brand-muted mt-1">
              First message shown when user starts a chat
            </p>
          </div>

          {/* Suggested Questions */}
          <div className="border-t border-brand-border pt-6 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-brand-secondary">
                Suggested Questions
              </h4>
              <p className="text-xs text-brand-muted mt-1">
                Add up to 10 suggested questions that users can click to start a
                conversation
              </p>
            </div>

            {suggestedQuestions.length > 0 && (
              <div className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-brand-surface rounded-lg border border-brand-border"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-brand-light flex-shrink-0"
                    >
                      <path d="M12 3v18m0 0l-6-6m6 6l6-6"></path>
                    </svg>
                    <span className="flex-1 text-sm text-brand-secondary">
                      {question}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSuggestedQuestions(
                          suggestedQuestions.filter((_, i) => i !== index),
                        );
                      }}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      title="Remove question"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {suggestedQuestions.length < 10 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Type a suggested question..."
                  disabled={isSubmitting}
                  maxLength={200}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (
                        newQuestion.trim() &&
                        suggestedQuestions.length < 10
                      ) {
                        setSuggestedQuestions([
                          ...suggestedQuestions,
                          newQuestion.trim(),
                        ]);
                        setNewQuestion("");
                      }
                    }
                  }}
                  className="flex-1 text-gray-900 px-4 py-2 border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newQuestion.trim() && suggestedQuestions.length < 10) {
                      setSuggestedQuestions([
                        ...suggestedQuestions,
                        newQuestion.trim(),
                      ]);
                      setNewQuestion("");
                    }
                  }}
                  disabled={isSubmitting || !newQuestion.trim()}
                  className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Add
                </button>
              </div>
            )}

            {suggestedQuestions.length >= 10 && (
              <p className="text-sm text-amber-600">
                Maximum of 10 questions reached
              </p>
            )}
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-brand-secondary mb-4">
              Widget Colors
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Color */}
              <div>
                <label
                  htmlFor="primaryColor"
                  className="block text-sm font-medium text-brand-secondary mb-2"
                >
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 w-20 border border-brand-border rounded cursor-pointer disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#001F54"
                    disabled={isSubmitting}
                    maxLength={7}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1 text-gray-900 px-3 py-2 border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-brand-muted mt-1">
                  Chat button color (navy blue by default)
                </p>
              </div>

              {/* Accent Color */}
              <div>
                <label
                  htmlFor="accentColor"
                  className="block text-sm font-medium text-brand-secondary mb-2"
                >
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="accentColor"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 w-20 border border-brand-border rounded cursor-pointer disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#3B82F6"
                    disabled={isSubmitting}
                    maxLength={7}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1 text-gray-900 px-3 py-2 border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-brand-muted mt-1">
                  Action buttons color (light blue by default)
                </p>
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="bg-brand-surface rounded-lg p-4 border border-brand-border">
            <p className="text-xs font-medium text-brand-secondary mb-3">
              Preview
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                style={{ backgroundColor: accentColor }}
              >
                Chat Button
              </button>
            </div>
          </div>

          {/* Animation Settings */}
          <div className="border-t border-brand-border pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-brand-secondary">
                  Action Bar Animation
                </label>
                <p className="text-xs text-brand-muted mt-0.5">
                  Icons bounce to draw attention when widget loads
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAnimationEnabled(!animationEnabled)}
                disabled={isSubmitting}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-50 ${
                  animationEnabled ? "bg-brand-blue" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    animationEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {animationEnabled && (
              <div className="flex items-center gap-4">
                <label
                  htmlFor="animationCycles"
                  className="text-sm font-medium text-brand-secondary whitespace-nowrap"
                >
                  Animation Cycles
                </label>
                <input
                  type="number"
                  id="animationCycles"
                  min={1}
                  max={20}
                  value={animationCycles}
                  onChange={(e) =>
                    setAnimationCycles(
                      Math.min(20, Math.max(1, parseInt(e.target.value) || 1)),
                    )
                  }
                  disabled={isSubmitting}
                  className="w-20 text-gray-900 px-3 py-2 border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50 text-sm"
                />
                <span className="text-xs text-brand-muted">
                  Times the animation repeats (1-20)
                </span>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Lead Capture Tab */}
        <TabsContent value="lead-capture" className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-6">
              Configure how you capture leads through your chatbot widget.
            </p>
          </div>

          <PlanGate requiredFeature="booking_wizard">
            <BookingConfigSection
              config={bookingConfig}
              onChange={setBookingConfig}
              disabled={isSubmitting}
            />
          </PlanGate>

          <PlanGate requiredFeature="text_request">
            <TextConfigSection
              config={textConfig}
              onChange={setTextConfig}
              disabled={isSubmitting}
            />
          </PlanGate>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div>
            <label
              htmlFor="allowedDomains"
              className="block text-sm font-medium text-brand-secondary mb-2"
            >
              Allowed Domains *
            </label>
            <input
              type="text"
              id="allowedDomains"
              value={domainsInput}
              onChange={(e) => setDomainsInput(e.target.value)}
              placeholder="example.com, *.example.com, or * for all domains"
              disabled={isSubmitting}
              className="w-full text-gray-900 px-4 py-2 border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-brand-muted mt-1">
              Comma-separated list of domains where this chatbot can be
              embedded. Use * to allow all domains.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-amber-800 mb-1">
              Security Note
            </h4>
            <p className="text-xs text-amber-700">
              Restricting domains prevents unauthorized websites from embedding
              your chatbot. Using * allows any website to embed it.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-4 border-t border-brand-border">
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 sm:py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Chatbot"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-6 py-2.5 sm:py-2 bg-white border border-brand-border text-gray-900 rounded-lg hover:bg-brand-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-center"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

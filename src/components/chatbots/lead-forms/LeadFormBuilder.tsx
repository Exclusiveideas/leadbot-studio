"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Eye, X } from "lucide-react";
import { nanoid } from "nanoid";
import type {
  FormField,
  CreateLeadFormInput,
} from "@/lib/validation/chatbot-lead-form";
import { FieldTypeSelector } from "./FieldTypeSelector";
import { FieldEditor } from "./FieldEditor";
import { FormPreviewModal } from "./FormPreviewModal";
import { Tour } from "../../tour/Tour";
import type { TourStep } from "@/hooks/useLeadFormTour";

const TOUR_STEPS: TourStep[] = [
  {
    id: "add-field",
    target: "add-field-button",
    title: "Add Fields to Your Form",
    description:
      "Click here to add different types of fields to your form. You can choose from text inputs, dropdowns, checkboxes, and more.",
    position: "bottom",
  },
  {
    id: "field-types",
    target: "field-type-selector",
    title: "Choose a Field Type",
    description:
      "Select the type of field you want to add. Each field type serves different purposes - text for names, email for addresses, select for options, etc.",
    position: "right",
  },
  {
    id: "field-editor",
    target: "field-editor-0",
    title: "Configure Your Field",
    description:
      "Click 'Edit' to configure field properties like label, placeholder, validation rules, and more. You can also reorder fields using the arrow buttons.",
    position: "left",
  },
  {
    id: "conditional-logic",
    target: "conditional-logic",
    title: "Add Conditional Logic",
    description:
      "Show or hide fields based on user responses. For example, show 'Company Name' only if user selects 'Business' as their type.",
    position: "left",
  },
  {
    id: "multi-step",
    target: "multi-step-toggle",
    title: "Create Multi-Step Forms",
    description:
      "Break long forms into multiple steps with progress indication. This improves completion rates and user experience.",
    position: "top",
  },
  {
    id: "preview",
    target: "preview-button",
    title: "Preview Your Form",
    description:
      "Click here to see exactly how your form will appear to users. Test it out before publishing!",
    position: "bottom",
  },
  {
    id: "appearance",
    target: "appearance-section",
    title: "Customize Appearance",
    description:
      "Personalize your form's colors and button text to match your brand identity.",
    position: "top",
  },
  {
    id: "save",
    target: "save-button",
    title: "Save Your Form",
    description:
      "Once you're happy with your form, click here to save it. You can always come back and edit it later!",
    position: "top",
  },
];

interface LeadFormBuilderProps {
  chatbotId: string;
  initialData?: Partial<CreateLeadFormInput> & { id?: string };
  isEditing?: boolean;
}

export function LeadFormBuilder({
  chatbotId,
  initialData,
  isEditing = false,
}: LeadFormBuilderProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formName, setFormName] = useState(initialData?.name || "");
  const [formDescription, setFormDescription] = useState(
    initialData?.description || "",
  );
  const [fields, setFields] = useState<FormField[]>(initialData?.fields || []);
  const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  // Appearance
  const [primaryColor, setPrimaryColor] = useState(
    initialData?.appearance?.primaryColor || "#10B981",
  );
  const [accentColor, setAccentColor] = useState(
    initialData?.appearance?.accentColor || "#059669",
  );
  const [buttonText, setButtonText] = useState(
    initialData?.appearance?.buttonText || "Submit",
  );

  // Behavior
  const [showSuccessMessage, setShowSuccessMessage] = useState(
    initialData?.behavior?.showSuccessMessage ?? true,
  );
  const [successMessage, setSuccessMessage] = useState(
    initialData?.behavior?.successMessage ||
      "Thank you for providing your information! An attorney will be in touch with you shortly.",
  );

  // Multi-Step
  const [multiStepEnabled, setMultiStepEnabled] = useState(
    initialData?.behavior?.multiStep?.enabled ?? false,
  );
  const [steps, setSteps] = useState<
    Array<{ title: string; description?: string }>
  >(
    initialData?.behavior?.multiStep?.steps || [
      { title: "Step 1", description: "" },
      { title: "Step 2", description: "" },
    ],
  );

  const handleAddField = (type: FormField["type"]) => {
    const newField: FormField = {
      id: `field_${nanoid(8)}`,
      type,
      label: "",
      placeholder: "",
      required: false,
      order: fields.length,
    };

    setFields([...fields, newField]);
    setShowFieldSelector(false);
  };

  const handleUpdateField = (index: number, updatedField: FormField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
  };

  const handleDeleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    // Reorder remaining fields
    const reorderedFields = newFields.map((field, i) => ({
      ...field,
      order: i,
    }));
    setFields(reorderedFields);
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [
      newFields[newIndex],
      newFields[index],
    ];

    // Update order values
    const reorderedFields = newFields.map((field, i) => ({
      ...field,
      order: i,
    }));
    setFields(reorderedFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      toast.error("Form name is required");
      return;
    }

    if (fields.length === 0) {
      toast.error("Please add at least one field");
      return;
    }

    // Validate that all fields have labels
    const invalidFields = fields.filter((f) => !f.label.trim());
    if (invalidFields.length > 0) {
      toast.error("All fields must have labels");
      return;
    }

    // Validate that select/radio/multiselect fields have options
    const fieldsNeedingOptions = fields.filter(
      (f) =>
        (f.type === "select" ||
          f.type === "multiselect" ||
          f.type === "radio") &&
        (!f.options || f.options.length === 0),
    );
    if (fieldsNeedingOptions.length > 0) {
      toast.error("Dropdown and radio fields must have at least one option");
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateLeadFormInput = {
        name: formName,
        description: formDescription || undefined,
        fields,
        appearance: {
          primaryColor,
          accentColor,
          buttonText,
        },
        behavior: {
          showSuccessMessage,
          successMessage: showSuccessMessage ? successMessage : undefined,
          multiStep: multiStepEnabled
            ? {
                enabled: true,
                steps,
              }
            : undefined,
        },
        isDefault,
        isActive,
      };

      const url = isEditing
        ? `/api/chatbots/${chatbotId}/lead-forms/${initialData?.id}`
        : `/api/chatbots/${chatbotId}/lead-forms`;
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save form");
      }

      toast.success(
        isEditing ? "Form updated successfully!" : "Form created successfully!",
      );

      router.push(`/chatbots/${chatbotId}/lead-forms`);
      router.refresh();
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save form",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Form Information
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Form Name *
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
            placeholder="e.g., Personal Injury Intake"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
            placeholder="Brief description of this form..."
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">
              Set as default form for this chatbot
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Form Fields</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isSubmitting || fields.length === 0}
              data-tour="preview-button"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setShowFieldSelector(!showFieldSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              disabled={isSubmitting}
              data-tour="add-field-button"
            >
              <Plus className="w-4 h-4" />
              Add Field
            </button>
          </div>
        </div>

        {showFieldSelector && (
          <div
            className="border-t border-gray-200 pt-4"
            data-tour="field-type-selector"
          >
            <p className="text-sm text-gray-600 mb-3">Select field type:</p>
            <FieldTypeSelector onSelectType={handleAddField} />
          </div>
        )}

        {fields.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">No fields added yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Click "Add Field" to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                data-tour={index === 0 ? "field-editor-0" : undefined}
              >
                <FieldEditor
                  field={field}
                  allFields={fields}
                  steps={multiStepEnabled ? steps : undefined}
                  onUpdate={(updatedField) =>
                    handleUpdateField(index, updatedField)
                  }
                  onDelete={() => handleDeleteField(index)}
                  onMoveUp={() => handleMoveField(index, "up")}
                  onMoveDown={() => handleMoveField(index, "down")}
                  canMoveUp={index > 0}
                  canMoveDown={index < fields.length - 1}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Step Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Multi-Step Form
          </h3>
          <label
            className="flex items-center gap-2"
            data-tour="multi-step-toggle"
          >
            <input
              type="checkbox"
              checked={multiStepEnabled}
              onChange={(e) => setMultiStepEnabled(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">
              Enable multi-step form
            </span>
          </label>
        </div>

        {multiStepEnabled && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Break your form into multiple steps with progress indication.
              Assign fields to steps in the field editor above.
            </p>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        const newSteps = [...steps];
                        newSteps[index] = {
                          ...newSteps[index],
                          title: e.target.value,
                        };
                        setSteps(newSteps);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 font-medium"
                      placeholder={`Step ${index + 1} title`}
                      disabled={isSubmitting}
                    />
                    <input
                      type="text"
                      value={step.description || ""}
                      onChange={(e) => {
                        const newSteps = [...steps];
                        newSteps[index] = {
                          ...newSteps[index],
                          description: e.target.value,
                        };
                        setSteps(newSteps);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm"
                      placeholder="Optional description"
                      disabled={isSubmitting}
                    />
                  </div>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newSteps = steps.filter((_, i) => i !== index);
                        setSteps(newSteps);
                        // Update fields that were assigned to deleted step
                        const updatedFields = fields.map((f) =>
                          f.step === index + 1
                            ? { ...f, step: 1 }
                            : f.step && f.step > index + 1
                              ? { ...f, step: f.step - 1 }
                              : f,
                        );
                        setFields(updatedFields);
                      }}
                      disabled={isSubmitting}
                      className="mt-2 text-red-600 hover:text-red-700 disabled:opacity-50"
                      title="Delete step"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {steps.length < 10 && (
              <button
                type="button"
                onClick={() => {
                  setSteps([
                    ...steps,
                    { title: `Step ${steps.length + 1}`, description: "" },
                  ]);
                }}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </button>
            )}
          </div>
        )}
      </div>

      {/* Appearance */}
      <div
        className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
        data-tour="appearance-section"
      >
        <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={isSubmitting}
                className="h-10 w-20 border border-gray-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                disabled={isSubmitting}
                className="h-10 w-20 border border-gray-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Submit Button Text
          </label>
          <input
            type="text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900"
            placeholder="Submit"
            disabled={isSubmitting}
            maxLength={50}
          />
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Success Message</h3>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showSuccessMessage}
            onChange={(e) => setShowSuccessMessage(e.target.checked)}
            disabled={isSubmitting}
            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700">
            Show success message after submission
          </span>
        </label>

        {showSuccessMessage && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900"
              placeholder="Thank you! An attorney will contact you shortly."
              disabled={isSubmitting}
              maxLength={500}
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          data-tour="save-button"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Form"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-6 py-2 bg-white border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Cancel
        </button>
      </div>

      {/* Preview Modal */}
      <FormPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        formName={formName || "Untitled Form"}
        fields={fields}
        appearance={{
          primaryColor,
          accentColor,
          buttonText,
        }}
        behavior={{
          showSuccessMessage,
          successMessage: showSuccessMessage ? successMessage : undefined,
          multiStep: multiStepEnabled
            ? {
                enabled: true,
                steps,
              }
            : undefined,
        }}
        successMessage={showSuccessMessage ? successMessage : undefined}
      />

      {/* Tour */}
      <Tour steps={TOUR_STEPS} autoStart={!isEditing} />
    </form>
  );
}

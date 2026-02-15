"use client";

import type { FormField } from "@/lib/validation/chatbot-lead-form";

interface FieldTypeSelectorProps {
  onSelectType: (type: FormField["type"]) => void;
}

const FIELD_TYPES: Array<{
  type: FormField["type"];
  label: string;
  description: string;
  icon: string;
}> = [
  {
    type: "text",
    label: "Text",
    description: "Single line text input",
    icon: "T",
  },
  {
    type: "email",
    label: "Email",
    description: "Email address input with validation",
    icon: "@",
  },
  {
    type: "phone",
    label: "Phone",
    description: "Phone number input",
    icon: "☎",
  },
  {
    type: "textarea",
    label: "Text Area",
    description: "Multi-line text input",
    icon: "¶",
  },
  {
    type: "select",
    label: "Dropdown",
    description: "Single selection from options",
    icon: "▼",
  },
  {
    type: "multiselect",
    label: "Multi-Select",
    description: "Multiple selections from options",
    icon: "☑",
  },
  {
    type: "checkbox",
    label: "Checkbox",
    description: "Yes/No toggle",
    icon: "✓",
  },
  {
    type: "radio",
    label: "Radio",
    description: "Single selection from visible options",
    icon: "◉",
  },
  {
    type: "date",
    label: "Date",
    description: "Date picker",
    icon: "📅",
  },
];

export function FieldTypeSelector({ onSelectType }: FieldTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {FIELD_TYPES.map((fieldType) => (
        <button
          key={fieldType.type}
          type="button"
          onClick={() => onSelectType(fieldType.type)}
          className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-colors text-left group"
        >
          <div className="text-2xl text-gray-400 group-hover:text-brand-blue">
            {fieldType.icon}
          </div>
          <div className="w-full">
            <h4 className="text-sm font-semibold text-gray-900">
              {fieldType.label}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {fieldType.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

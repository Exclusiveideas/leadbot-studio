"use client";

import { X } from "lucide-react";
import type { FormField } from "@/lib/validation/chatbot-lead-form";

interface ConditionalLogicEditorProps {
  field: FormField;
  allFields: FormField[];
  onUpdate: (conditionalDisplay: FormField["conditionalDisplay"]) => void;
  onRemove: () => void;
}

const OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "notEquals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "greaterThan", label: "is greater than" },
  { value: "lessThan", label: "is less than" },
] as const;

export function ConditionalLogicEditor({
  field,
  allFields,
  onUpdate,
  onRemove,
}: ConditionalLogicEditorProps) {
  const availableFields = allFields.filter((f) => f.id !== field.id);

  const selectedFieldId = field.conditionalDisplay?.field || "";
  const selectedOperator = field.conditionalDisplay?.operator || "equals";
  const conditionValue = field.conditionalDisplay?.value || "";

  // Find the selected field to determine its type
  const selectedField = availableFields.find((f) => f.id === selectedFieldId);

  const handleFieldChange = (fieldId: string) => {
    onUpdate({
      field: fieldId,
      operator: selectedOperator,
      value: conditionValue,
    });
  };

  const handleOperatorChange = (
    operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan",
  ) => {
    onUpdate({
      field: selectedFieldId,
      operator,
      value: conditionValue,
    });
  };

  const handleValueChange = (value: string) => {
    onUpdate({
      field: selectedFieldId,
      operator: selectedOperator,
      value,
    });
  };

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-blue-900">
          Conditional Display Logic
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="text-blue-600 hover:text-blue-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-blue-700">
        Show this field only when the following condition is met:
      </p>

      <div className="grid grid-cols-3 gap-2">
        {/* Field Selection */}
        <div>
          <label className="block text-xs text-blue-900 mb-1">When field</label>
          <select
            value={selectedFieldId}
            onChange={(e) => handleFieldChange(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded bg-white text-gray-900"
          >
            <option value="">Select field...</option>
            {availableFields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label || f.id}
              </option>
            ))}
          </select>
        </div>

        {/* Operator Selection */}
        <div>
          <label className="block text-xs text-blue-900 mb-1">Condition</label>
          <select
            value={selectedOperator}
            onChange={(e) =>
              handleOperatorChange(e.target.value as typeof selectedOperator)
            }
            className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded bg-white text-gray-900"
            disabled={!selectedFieldId}
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        {/* Value Input */}
        <div>
          <label className="block text-xs text-blue-900 mb-1">Value</label>
          {selectedField?.type === "select" ||
          selectedField?.type === "radio" ? (
            <select
              value={String(conditionValue)}
              onChange={(e) => handleValueChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded bg-white text-gray-900"
              disabled={!selectedFieldId}
            >
              <option value="">Select value...</option>
              {selectedField.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : selectedField?.type === "checkbox" ? (
            <select
              value={String(conditionValue)}
              onChange={(e) => handleValueChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded bg-white text-gray-900"
              disabled={!selectedFieldId}
            >
              <option value="">Select...</option>
              <option value="true">Checked</option>
              <option value="false">Unchecked</option>
            </select>
          ) : (
            <input
              type="text"
              value={String(conditionValue)}
              onChange={(e) => handleValueChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded bg-white text-gray-900"
              placeholder="Enter value..."
              disabled={!selectedFieldId}
            />
          )}
        </div>
      </div>

      <div className="text-xs text-blue-700 bg-blue-100 rounded p-2">
        <strong>Example:</strong> This field will only appear when "
        {selectedField?.label || "selected field"}"{" "}
        {selectedOperator.replace(/([A-Z])/g, " $1").toLowerCase()} "
        {conditionValue || "value"}"
      </div>
    </div>
  );
}

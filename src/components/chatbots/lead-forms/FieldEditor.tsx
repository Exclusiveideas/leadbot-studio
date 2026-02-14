"use client";

import { useState } from "react";
import { X, GripVertical, Plus, Trash2, Zap } from "lucide-react";
import type { FormField } from "@/lib/validation/chatbot-lead-form";
import { ConditionalLogicEditor } from "./ConditionalLogicEditor";

interface FieldEditorProps {
  field: FormField;
  allFields: FormField[];
  steps?: Array<{ title: string; description?: string }>;
  onUpdate: (field: FormField) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function FieldEditor({
  field,
  allFields,
  steps,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: FieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConditionalLogic, setShowConditionalLogic] = useState(
    !!field.conditionalDisplay,
  );

  const needsOptions =
    field.type === "select" ||
    field.type === "multiselect" ||
    field.type === "radio";

  const handleAddOption = () => {
    const options = field.options || [];
    onUpdate({
      ...field,
      options: [
        ...options,
        {
          label: `Option ${options.length + 1}`,
          value: `option_${options.length + 1}`,
        },
      ],
    });
  };

  const handleUpdateOption = (
    index: number,
    key: "label" | "value",
    value: string,
  ) => {
    const options = [...(field.options || [])];
    options[index] = { ...options[index], [key]: value };
    onUpdate({ ...field, options });
  };

  const handleDeleteOption = (index: number) => {
    const options = [...(field.options || [])];
    options.splice(index, 1);
    onUpdate({ ...field, options });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        <GripVertical className="w-5 h-5 text-gray-400" />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {field.type}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {field.label || "Untitled Field"}
            </span>
            {field.required && (
              <span className="text-xs text-red-500">Required</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
        >
          {isExpanded ? "Collapse" : "Edit"}
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700"
          title="Delete field"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Expanded Editor */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Label *
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate({ ...field, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
              placeholder="e.g., Full Name"
            />
          </div>

          {/* Placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={field.placeholder || ""}
              onChange={(e) =>
                onUpdate({ ...field, placeholder: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
              placeholder="e.g., John Doe"
            />
          </div>

          {/* Required Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`required-${field.id}`}
              checked={field.required}
              onChange={(e) =>
                onUpdate({ ...field, required: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label
              htmlFor={`required-${field.id}`}
              className="text-sm text-gray-700"
            >
              Required field
            </label>
          </div>

          {/* Step Assignment */}
          {steps && steps.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Step
              </label>
              <select
                value={field.step || 1}
                onChange={(e) =>
                  onUpdate({ ...field, step: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
              >
                {steps.map((step, index) => (
                  <option key={index} value={index + 1}>
                    Step {index + 1}: {step.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                This field will appear in the selected step
              </p>
            </div>
          )}

          {/* AI Extractable */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`ai-${field.id}`}
              checked={field.aiExtractable || false}
              onChange={(e) =>
                onUpdate({ ...field, aiExtractable: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor={`ai-${field.id}`} className="text-sm text-gray-700">
              AI can pre-fill this field
            </label>
          </div>

          {/* AI Extraction Key */}
          {field.aiExtractable && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Extraction Key
              </label>
              <input
                type="text"
                value={field.aiExtractionKey || ""}
                onChange={(e) =>
                  onUpdate({ ...field, aiExtractionKey: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                placeholder="e.g., name, email, phone"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maps to AI extracted data (e.g., "name", "email", "phone")
              </p>
            </div>
          )}

          {/* Options for select/radio/multiselect */}
          {needsOptions && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Options
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </button>
              </div>

              <div className="space-y-2">
                {(field.options || []).map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) =>
                        handleUpdateOption(index, "label", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900"
                      placeholder="Option label"
                    />
                    <input
                      type="text"
                      value={option.value}
                      onChange={(e) =>
                        handleUpdateOption(index, "value", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900"
                      placeholder="Option value"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Validation Rules
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {(field.type === "text" || field.type === "textarea") && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Min Length
                    </label>
                    <input
                      type="number"
                      value={field.validation?.min || ""}
                      onChange={(e) =>
                        onUpdate({
                          ...field,
                          validation: {
                            ...field.validation,
                            min: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                      placeholder="e.g., 1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Max Length
                    </label>
                    <input
                      type="number"
                      value={field.validation?.max || ""}
                      onChange={(e) =>
                        onUpdate({
                          ...field,
                          validation: {
                            ...field.validation,
                            max: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                      placeholder="e.g., 100"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Conditional Logic */}
          <div
            className="border-t border-gray-200 pt-4"
            data-tour="conditional-logic"
          >
            {showConditionalLogic ? (
              <ConditionalLogicEditor
                field={field}
                allFields={allFields}
                onUpdate={(conditionalDisplay) =>
                  onUpdate({ ...field, conditionalDisplay })
                }
                onRemove={() => {
                  setShowConditionalLogic(false);
                  onUpdate({ ...field, conditionalDisplay: undefined });
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowConditionalLogic(true)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Zap className="w-4 h-4" />
                Add Conditional Logic
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

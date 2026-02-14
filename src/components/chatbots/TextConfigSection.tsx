"use client";

import { ChevronDown, ChevronUp, Phone, Settings } from "lucide-react";
import { useState } from "react";
import type { TextConfig } from "@/lib/validation/chatbot-text";

type TextConfigSectionProps = {
  config: TextConfig;
  onChange: (config: TextConfig) => void;
  disabled?: boolean;
};

const DEFAULT_CONSENT_TEXT =
  "By submitting this form, you consent to receive text messages from us. Message and data rates may apply. Reply STOP to opt out.";

export default function TextConfigSection({
  config,
  onChange,
  disabled = false,
}: TextConfigSectionProps) {
  const [isExpanded, setIsExpanded] = useState(config.enabled);

  const updateConfig = (updates: Partial<TextConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateFieldConfig = (
    fieldName: keyof NonNullable<TextConfig["fields"]>,
    updates: { enabled?: boolean; required?: boolean },
  ) => {
    const currentFields = config.fields || {};
    const currentField = currentFields[fieldName] || {};

    updateConfig({
      fields: {
        ...currentFields,
        [fieldName]: {
          ...currentField,
          ...updates,
        },
      },
    });
  };

  return (
    <div className="space-y-4 border-2 border-gray-200 rounded-lg p-6 bg-white">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Phone className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Send us a Text</h3>
            <p className="text-sm text-gray-500">
              Allow visitors to request a text/call back
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => {
              updateConfig({ enabled: e.target.checked });
              if (e.target.checked) {
                setIsExpanded(true);
              }
            }}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>

      {/* Expand/collapse button */}
      {config.enabled && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <Settings className="w-4 h-4" />
          Configure Settings
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Configuration panel */}
      {config.enabled && isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {/* Field Configuration */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Form Fields
            </h4>
            <div className="space-y-3">
              {/* First Name */}
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">First Name</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={config.fields?.firstName?.required !== false}
                      onChange={(e) =>
                        updateFieldConfig("firstName", {
                          required: e.target.checked,
                        })
                      }
                      disabled={disabled}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Required
                  </label>
                </div>
              </div>

              {/* Last Name */}
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Last Name</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={config.fields?.lastName?.required !== false}
                      onChange={(e) =>
                        updateFieldConfig("lastName", {
                          required: e.target.checked,
                        })
                      }
                      disabled={disabled}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Required
                  </label>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Phone Number</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={config.fields?.phone?.required !== false}
                      onChange={(e) =>
                        updateFieldConfig("phone", {
                          required: e.target.checked,
                        })
                      }
                      disabled={disabled}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Required
                  </label>
                </div>
              </div>

              {/* Email (can be disabled) */}
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Email</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={config.fields?.email?.enabled !== false}
                      onChange={(e) =>
                        updateFieldConfig("email", {
                          enabled: e.target.checked,
                        })
                      }
                      disabled={disabled}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Show
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={config.fields?.email?.required === true}
                      onChange={(e) =>
                        updateFieldConfig("email", {
                          required: e.target.checked,
                        })
                      }
                      disabled={
                        disabled || config.fields?.email?.enabled === false
                      }
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                    />
                    Required
                  </label>
                </div>
              </div>

              {/* Message */}
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Message</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={config.fields?.message?.required !== false}
                      onChange={(e) =>
                        updateFieldConfig("message", {
                          required: e.target.checked,
                        })
                      }
                      disabled={disabled}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Required
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Consent Text */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Consent Disclaimer
            </label>
            <textarea
              value={config.consentText || DEFAULT_CONSENT_TEXT}
              onChange={(e) => updateConfig({ consentText: e.target.value })}
              disabled={disabled}
              rows={3}
              placeholder={DEFAULT_CONSENT_TEXT}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              This text appears below the form to inform visitors about text
              message consent.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

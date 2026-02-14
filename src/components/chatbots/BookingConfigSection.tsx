"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Tag,
} from "lucide-react";
import type {
  BookingConfig,
  BookingCategory,
  BookingLocation,
  TimeSlot,
} from "@/lib/validation/chatbot-booking";

type BookingConfigSectionProps = {
  config: BookingConfig;
  onChange: (config: BookingConfig) => void;
  disabled?: boolean;
};

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { start: "09:00", end: "09:30" },
  { start: "09:30", end: "10:00" },
  { start: "10:00", end: "10:30" },
  { start: "10:30", end: "11:00" },
  { start: "11:00", end: "11:30" },
  { start: "11:30", end: "12:00" },
  { start: "14:00", end: "14:30" },
  { start: "14:30", end: "15:00" },
  { start: "15:00", end: "15:30" },
  { start: "15:30", end: "16:00" },
  { start: "16:00", end: "16:30" },
  { start: "16:30", end: "17:00" },
];

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export default function BookingConfigSection({
  config,
  onChange,
  disabled = false,
}: BookingConfigSectionProps) {
  const [expandedSection, setExpandedSection] = useState<
    "categories" | "locations" | null
  >(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null,
  );

  const updateConfig = (updates: Partial<BookingConfig>) => {
    onChange({ ...config, ...updates });
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Category handlers
  const addCategory = () => {
    const newCategory: BookingCategory = {
      id: generateId(),
      name: "",
      subCategories: [],
    };
    updateConfig({
      categories: [...config.categories, newCategory],
    });
    setEditingCategoryId(newCategory.id);
    setExpandedSection("categories");
  };

  const updateCategory = (id: string, updates: Partial<BookingCategory>) => {
    updateConfig({
      categories: config.categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    });
  };

  const deleteCategory = (id: string) => {
    updateConfig({
      categories: config.categories.filter((c) => c.id !== id),
    });
    if (editingCategoryId === id) {
      setEditingCategoryId(null);
    }
  };

  const addSubCategory = (categoryId: string) => {
    const category = config.categories.find((c) => c.id === categoryId);
    if (!category) return;

    const newSubCategory = {
      id: generateId(),
      name: "",
    };

    updateCategory(categoryId, {
      subCategories: [...(category.subCategories || []), newSubCategory],
    });
  };

  const updateSubCategory = (
    categoryId: string,
    subCategoryId: string,
    name: string,
  ) => {
    const category = config.categories.find((c) => c.id === categoryId);
    if (!category) return;

    updateCategory(categoryId, {
      subCategories: category.subCategories?.map((sc) =>
        sc.id === subCategoryId ? { ...sc, name } : sc,
      ),
    });
  };

  const deleteSubCategory = (categoryId: string, subCategoryId: string) => {
    const category = config.categories.find((c) => c.id === categoryId);
    if (!category) return;

    updateCategory(categoryId, {
      subCategories: category.subCategories?.filter(
        (sc) => sc.id !== subCategoryId,
      ),
    });
  };

  // Location handlers
  const addLocation = () => {
    const newLocation: BookingLocation = {
      id: generateId(),
      name: "",
      address: "",
      timeSlots: [...DEFAULT_TIME_SLOTS],
      availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    };
    updateConfig({
      locations: [...config.locations, newLocation],
    });
    setEditingLocationId(newLocation.id);
    setExpandedSection("locations");
  };

  const updateLocation = (id: string, updates: Partial<BookingLocation>) => {
    updateConfig({
      locations: config.locations.map((l) =>
        l.id === id ? { ...l, ...updates } : l,
      ),
    });
  };

  const deleteLocation = (id: string) => {
    updateConfig({
      locations: config.locations.filter((l) => l.id !== id),
    });
    if (editingLocationId === id) {
      setEditingLocationId(null);
    }
  };

  const addTimeSlot = (locationId: string) => {
    const location = config.locations.find((l) => l.id === locationId);
    if (!location) return;

    const newSlot: TimeSlot = { start: "09:00", end: "09:30" };
    updateLocation(locationId, {
      timeSlots: [...location.timeSlots, newSlot],
    });
  };

  const updateTimeSlot = (
    locationId: string,
    index: number,
    updates: Partial<TimeSlot>,
  ) => {
    const location = config.locations.find((l) => l.id === locationId);
    if (!location) return;

    updateLocation(locationId, {
      timeSlots: location.timeSlots.map((slot, i) =>
        i === index ? { ...slot, ...updates } : slot,
      ),
    });
  };

  const deleteTimeSlot = (locationId: string, index: number) => {
    const location = config.locations.find((l) => l.id === locationId);
    if (!location) return;

    updateLocation(locationId, {
      timeSlots: location.timeSlots.filter((_, i) => i !== index),
    });
  };

  const toggleDay = (locationId: string, day: string) => {
    const location = config.locations.find((l) => l.id === locationId);
    if (!location) return;

    const availableDays = location.availableDays.includes(day)
      ? location.availableDays.filter((d) => d !== day)
      : [...location.availableDays, day];

    updateLocation(locationId, { availableDays });
  };

  return (
    <div className="border-t border-gray-200 pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Appointment Booking
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure appointment scheduling for your chatbot widget
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-700">
            {config.enabled ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>

      {config.enabled && (
        <>
          {/* Categories Section */}
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() =>
                setExpandedSection(
                  expandedSection === "categories" ? null : "categories",
                )
              }
              disabled={disabled}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-gray-500" />
                <div>
                  <h4 className="font-medium text-gray-900">Case Categories</h4>
                  <p className="text-sm text-gray-500">
                    {config.categories.length} categor
                    {config.categories.length === 1 ? "y" : "ies"} configured
                  </p>
                </div>
              </div>
              {expandedSection === "categories" ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSection === "categories" && (
              <div className="p-4 pt-0 space-y-4">
                {config.categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={category.name}
                          onChange={(e) =>
                            updateCategory(category.id, {
                              name: e.target.value,
                            })
                          }
                          placeholder="Category name (e.g., Bankruptcy)"
                          disabled={disabled}
                          className="w-full text-gray-900 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-sm"
                        />

                        {/* Sub-categories */}
                        <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                          <p className="text-xs text-gray-500 font-medium">
                            Sub-categories
                          </p>
                          {category.subCategories?.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={sub.name}
                                onChange={(e) =>
                                  updateSubCategory(
                                    category.id,
                                    sub.id,
                                    e.target.value,
                                  )
                                }
                                placeholder="Sub-category name"
                                disabled={disabled}
                                className="flex-1 text-gray-900 px-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  deleteSubCategory(category.id, sub.id)
                                }
                                disabled={disabled}
                                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addSubCategory(category.id)}
                            disabled={disabled}
                            className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                            Add sub-category
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCategory(category.id)}
                        disabled={disabled}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addCategory}
                  disabled={disabled}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Category
                </button>
              </div>
            )}
          </div>

          {/* Locations Section */}
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() =>
                setExpandedSection(
                  expandedSection === "locations" ? null : "locations",
                )
              }
              disabled={disabled}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Office Locations
                  </h4>
                  <p className="text-sm text-gray-500">
                    {config.locations.length} location
                    {config.locations.length === 1 ? "" : "s"} configured
                  </p>
                </div>
              </div>
              {expandedSection === "locations" ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSection === "locations" && (
              <div className="p-4 pt-0 space-y-4">
                {config.locations.map((location) => (
                  <div
                    key={location.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={location.name}
                          onChange={(e) =>
                            updateLocation(location.id, {
                              name: e.target.value,
                            })
                          }
                          placeholder="Location name (e.g., Downtown Office)"
                          disabled={disabled}
                          className="w-full text-gray-900 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-sm"
                        />
                        <input
                          type="text"
                          value={location.address}
                          onChange={(e) =>
                            updateLocation(location.id, {
                              address: e.target.value,
                            })
                          }
                          placeholder="Full address"
                          disabled={disabled}
                          className="w-full text-gray-900 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteLocation(location.id)}
                        disabled={disabled}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Available Days */}
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-2">
                        Available Days
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(location.id, day)}
                            disabled={disabled}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                              location.availableDays.includes(day)
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-500"
                            } disabled:opacity-50`}
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <p className="text-xs text-gray-500 font-medium">
                          Available Time Slots ({location.timeSlots.length})
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {location.timeSlots.map((slot, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-gray-50 rounded px-2 py-1"
                          >
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) =>
                                updateTimeSlot(location.id, index, {
                                  start: e.target.value,
                                })
                              }
                              disabled={disabled}
                              className="text-xs text-gray-700 bg-transparent border-0 p-0 focus:ring-0"
                            />
                            <span className="text-gray-400 text-xs">-</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) =>
                                updateTimeSlot(location.id, index, {
                                  end: e.target.value,
                                })
                              }
                              disabled={disabled}
                              className="text-xs text-gray-700 bg-transparent border-0 p-0 focus:ring-0"
                            />
                            <button
                              type="button"
                              onClick={() => deleteTimeSlot(location.id, index)}
                              disabled={disabled}
                              className="text-red-400 hover:text-red-600 disabled:opacity-50 ml-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addTimeSlot(location.id)}
                        disabled={disabled}
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-50 mt-2"
                      >
                        <Plus className="h-3 w-3" />
                        Add time slot
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addLocation}
                  disabled={disabled}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Location
                </button>
              </div>
            )}
          </div>

          {/* Require Case Description */}
          <div className="flex items-center justify-between py-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Require Case Description
              </label>
              <p className="text-xs text-gray-500">
                Ask users to describe their case before booking
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.requireCaseDescription ?? true}
                onChange={(e) =>
                  updateConfig({ requireCaseDescription: e.target.checked })
                }
                disabled={disabled}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Validation Messages */}
          {config.enabled &&
            (config.categories.length === 0 ||
              config.locations.length === 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  {config.categories.length === 0 &&
                  config.locations.length === 0
                    ? "Add at least one category and one location to enable booking."
                    : config.categories.length === 0
                      ? "Add at least one category to enable booking."
                      : "Add at least one location to enable booking."}
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}

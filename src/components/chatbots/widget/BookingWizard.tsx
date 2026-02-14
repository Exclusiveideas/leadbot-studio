"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  Calendar,
  Clock,
  MapPin,
  Loader2,
} from "lucide-react";
import type { BookingConfig } from "@/lib/validation/chatbot-booking";

type BookingWizardProps = {
  chatbotId: string;
  config: BookingConfig;
  onBack: () => void;
  onComplete: () => void;
  primaryColor?: string;
};

type WizardStep =
  | "category"
  | "subcategory"
  | "description"
  | "contact"
  | "location"
  | "datetime"
  | "confirmation";

type FormData = {
  categoryId: string;
  categoryName: string;
  subCategoryId?: string;
  subCategoryName?: string;
  caseDescription?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  appointmentDate: string;
  appointmentTime: string;
};

const INITIAL_FORM_DATA: FormData = {
  categoryId: "",
  categoryName: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  locationId: "",
  locationName: "",
  locationAddress: "",
  appointmentDate: "",
  appointmentTime: "",
};

export default function BookingWizard({
  chatbotId,
  config,
  onBack,
  onComplete,
  primaryColor = "#001F54",
}: BookingWizardProps) {
  const [step, setStep] = useState<WizardStep>("category");
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = config.categories.find(
    (c) => c.id === formData.categoryId,
  );
  const hasSubCategories =
    selectedCategory?.subCategories &&
    selectedCategory.subCategories.length > 0;
  const selectedLocation = config.locations.find(
    (l) => l.id === formData.locationId,
  );

  // Determine steps based on config
  const getSteps = (): WizardStep[] => {
    const steps: WizardStep[] = ["category"];
    if (hasSubCategories) steps.push("subcategory");
    if (config.requireCaseDescription !== false) steps.push("description");
    steps.push("contact", "location", "datetime", "confirmation");
    return steps;
  };

  const steps = getSteps();
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Fetch available time slots when location and date are selected
  useEffect(() => {
    if (formData.locationId && formData.appointmentDate) {
      fetchAvailableSlots();
    }
  }, [formData.locationId, formData.appointmentDate]);

  const fetchAvailableSlots = async () => {
    setIsLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/public/chatbots/${chatbotId}/bookings?locationId=${formData.locationId}&date=${formData.appointmentDate}`,
      );
      if (response.ok) {
        const { data } = await response.json();
        setAvailableSlots(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch slots:", err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex === 0) {
      onBack();
    } else {
      setStep(steps[currentStepIndex - 1]);
    }
  };

  const selectCategory = (category: { id: string; name: string }) => {
    setFormData({
      ...formData,
      categoryId: category.id,
      categoryName: category.name,
      subCategoryId: undefined,
      subCategoryName: undefined,
    });
    goToNextStep();
  };

  const selectSubCategory = (sub: { id: string; name: string }) => {
    setFormData({
      ...formData,
      subCategoryId: sub.id,
      subCategoryName: sub.name,
    });
    goToNextStep();
  };

  const selectLocation = (location: {
    id: string;
    name: string;
    address: string;
  }) => {
    setFormData({
      ...formData,
      locationId: location.id,
      locationName: location.name,
      locationAddress: location.address,
      appointmentDate: "",
      appointmentTime: "",
    });
    goToNextStep();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/public/chatbots/${chatbotId}/bookings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: `booking-${Date.now()}`,
            categoryId: formData.categoryId,
            categoryName: formData.categoryName,
            subCategoryId: formData.subCategoryId,
            subCategoryName: formData.subCategoryName,
            caseDescription: formData.caseDescription,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            locationId: formData.locationId,
            locationName: formData.locationName,
            locationAddress: formData.locationAddress,
            appointmentDate: formData.appointmentDate,
            appointmentTime: formData.appointmentTime,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit booking");
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available dates for the selected location
  const getAvailableDates = () => {
    if (!selectedLocation) return [];

    const dates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayName = date
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();

      if (selectedLocation.availableDays.includes(dayName)) {
        dates.push(date.toISOString().split("T")[0]);
      }
    }

    return dates;
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Progress */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={goToPrevStep}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Schedule an Appointment
            </h2>
            <p className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
        </div>
        <div className="h-1 bg-gray-100">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: primaryColor }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Category Selection */}
        {step === "category" && (
          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900">
              What type of case do you have?
            </h3>
            <div className="grid gap-3">
              {config.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => selectCategory(category)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                >
                  <span className="font-medium text-gray-900">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-category Selection */}
        {step === "subcategory" && selectedCategory && (
          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900">
              Select a specific area within {formData.categoryName}
            </h3>
            <div className="grid gap-3">
              {selectedCategory.subCategories?.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => selectSubCategory(sub)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                >
                  <span className="font-medium text-gray-900">{sub.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Case Description */}
        {step === "description" && (
          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900">
              Please describe your situation
            </h3>
            <p className="text-sm text-gray-500">
              This helps us prepare for your consultation.
            </p>
            <textarea
              value={formData.caseDescription || ""}
              onChange={(e) =>
                setFormData({ ...formData, caseDescription: e.target.value })
              }
              placeholder="Tell us about your case..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              onClick={goToNextStep}
              disabled={
                config.requireCaseDescription !== false &&
                !formData.caseDescription?.trim()
              }
              className="w-full py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Contact Information */}
        {step === "contact" && (
          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900">
              Your contact information
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={goToNextStep}
              disabled={
                !formData.firstName.trim() ||
                !formData.lastName.trim() ||
                !formData.email.trim() ||
                !formData.phone.trim()
              }
              className="w-full py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Location Selection */}
        {step === "location" && (
          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900">
              Select a location
            </h3>
            <div className="grid gap-3">
              {config.locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => selectLocation(location)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {location.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {location.address}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date & Time Selection */}
        {step === "datetime" && selectedLocation && (
          <div className="space-y-6">
            {/* Date Selection */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Select a date
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {getAvailableDates().map((date) => (
                  <button
                    key={date}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        appointmentDate: date,
                        appointmentTime: "",
                      })
                    }
                    className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-colors ${
                      formData.appointmentDate === date
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Calendar className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {formatDateDisplay(date)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {formData.appointmentDate && (
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">
                  Select a time
                </h3>
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {(availableSlots.length > 0
                      ? availableSlots
                      : selectedLocation.timeSlots.map((s) => s.start)
                    ).map((time) => (
                      <button
                        key={time}
                        onClick={() =>
                          setFormData({ ...formData, appointmentTime: time })
                        }
                        className={`px-3 py-2.5 rounded-xl border transition-colors text-sm font-medium ${
                          formData.appointmentTime === time
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5 inline mr-1" />
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={goToNextStep}
              disabled={!formData.appointmentDate || !formData.appointmentTime}
              className="w-full py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Confirmation */}
        {step === "confirmation" && (
          <div className="space-y-6">
            <h3 className="text-base font-medium text-gray-900">
              Confirm your appointment
            </h3>

            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900">
                    {formatDateDisplay(formData.appointmentDate)} at{" "}
                    {formData.appointmentTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">
                    {formData.locationName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formData.locationAddress}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500 mb-1">Service</p>
                <p className="font-medium text-gray-900">
                  {formData.categoryName}
                  {formData.subCategoryName && ` - ${formData.subCategoryName}`}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500 mb-1">Contact</p>
                <p className="font-medium text-gray-900">
                  {formData.firstName} {formData.lastName}
                </p>
                <p className="text-sm text-gray-500">{formData.email}</p>
                <p className="text-sm text-gray-500">{formData.phone}</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Confirm Appointment
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

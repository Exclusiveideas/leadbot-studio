"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Phone,
  Mic,
  Play,
  Pause,
  Clock,
  Volume2,
  PhoneForwarded,
  Shield,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  Search,
  Trash2,
  MapPin,
  CalendarDays,
  Globe,
} from "lucide-react";
import Link from "next/link";
import PlanGate from "@/components/shared/PlanGate";
import { useOrganizationPlan } from "@/components/shared/PlanGate";

type VoiceConfig = {
  id?: string;
  enabled: boolean;
  twilioPhoneNumber: string | null;
  voiceId: string;
  voiceName: string;
  greetingMessage: string;
  voiceMailMessage: string | null;
  maxCallDurationSeconds: number;
  silenceTimeoutSeconds: number;
  language: string;
  businessHours: Record<string, unknown> | null;
  transferEnabled: boolean;
  transferPhoneNumber: string | null;
  recordingEnabled: boolean;
};

type Voice = {
  id: string;
  name: string;
  previewUrl: string | null;
  accent: string | null;
  gender: string | null;
  useCase: string | null;
};

type VoiceUsage = {
  used: number;
  limit: number;
  callCount: number;
};

type AvailableNumber = {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  isoCountry: string;
};

const DEFAULT_CONFIG: VoiceConfig = {
  enabled: false,
  twilioPhoneNumber: null,
  voiceId: "rachel",
  voiceName: "Rachel",
  greetingMessage: "Hello! Thank you for calling. How can I help you today?",
  voiceMailMessage: null,
  maxCallDurationSeconds: 600,
  silenceTimeoutSeconds: 10,
  language: "en",
  businessHours: null,
  transferEnabled: false,
  transferPhoneNumber: null,
  recordingEnabled: false,
};

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
  { value: "nl", label: "Dutch" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
];

type DayAbbr = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type DaySchedule = {
  start: string;
  end: string;
};

type BusinessHoursData = {
  timezone: string;
  schedule: Partial<Record<DayAbbr, DaySchedule>>;
};

const DAYS: { key: DayAbbr; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    );
  }
}

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "UTC",
];

const DEFAULT_BUSINESS_HOURS: BusinessHoursData = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  schedule: {
    mon: { start: "09:00", end: "17:00" },
    tue: { start: "09:00", end: "17:00" },
    wed: { start: "09:00", end: "17:00" },
    thu: { start: "09:00", end: "17:00" },
    fri: { start: "09:00", end: "17:00" },
  },
};

function UsageBar({ usage }: { usage: VoiceUsage }) {
  const pct =
    usage.limit > 0 ? Math.min((usage.used / usage.limit) * 100, 100) : 0;
  const isWarning = pct >= 80;
  const isExceeded = pct >= 100;

  return (
    <div className="bg-white rounded-xl border border-brand-border elevation-1 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PhoneCall className="h-4 w-4 text-brand-muted" />
          <span className="text-sm font-medium text-brand-primary">
            Voice Minutes
          </span>
        </div>
        <span className="text-sm text-brand-muted">
          {usage.callCount} call{usage.callCount !== 1 ? "s" : ""} this month
        </span>
      </div>
      <div className="h-2 bg-brand-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isExceeded
              ? "bg-red-500"
              : isWarning
                ? "bg-amber-500"
                : "bg-gradient-to-r from-[#ffd78c] to-[#ffab7a]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-brand-muted">
          {Math.round(usage.used)} / {usage.limit} min used
        </span>
        {isWarning && !isExceeded && (
          <span className="text-xs text-amber-600 font-medium">
            Approaching limit
          </span>
        )}
        {isExceeded && (
          <span className="text-xs text-red-600 font-medium">
            Limit reached
          </span>
        )}
      </div>
    </div>
  );
}

function VoiceCard({
  voice,
  selected,
  onSelect,
}: {
  voice: Voice;
  selected: boolean;
  onSelect: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const togglePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!voice.previewUrl) return;

    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(voice.previewUrl);
        audioRef.current.onended = () => setPlaying(false);
      }
      audioRef.current.play();
      setPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative text-left p-4 rounded-xl border-2 transition-all ${
        selected
          ? "border-[#ffab7a] bg-[#ffab7a]/5 shadow-sm"
          : "border-brand-border bg-white hover:border-brand-muted"
      }`}
    >
      {selected && (
        <div className="absolute top-2.5 right-2.5">
          <CheckCircle2 className="h-4 w-4 text-[#ffab7a]" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
            selected ? "bg-[#ffab7a]/15" : "bg-brand-surface"
          }`}
        >
          <Mic
            className={`h-4 w-4 ${selected ? "text-[#ffab7a]" : "text-brand-muted"}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brand-primary truncate">
            {voice.name}
          </p>
          <p className="text-xs text-brand-muted truncate">
            {[voice.gender, voice.accent, voice.useCase]
              .filter(Boolean)
              .join(" · ") || "Voice"}
          </p>
        </div>
        {voice.previewUrl && (
          <button
            type="button"
            onClick={togglePreview}
            className="h-8 w-8 rounded-full flex items-center justify-center bg-brand-surface hover:bg-brand-border transition-colors shrink-0"
          >
            {playing ? (
              <Pause className="h-3.5 w-3.5 text-brand-primary" />
            ) : (
              <Play className="h-3.5 w-3.5 text-brand-primary ml-0.5" />
            )}
          </button>
        )}
      </div>
    </button>
  );
}

export default function VoiceSettingsPage() {
  const params = useParams();
  const chatbotId = params.id as string;
  const plan = useOrganizationPlan();

  const [config, setConfig] = useState<VoiceConfig>(DEFAULT_CONFIG);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [usage, setUsage] = useState<VoiceUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Phone provisioning state
  const [phoneAreaCode, setPhoneAreaCode] = useState("");
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>(
    [],
  );
  const [isSearchingNumbers, setIsSearchingNumbers] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const searchNumbers = async () => {
    setIsSearchingNumbers(true);
    setPhoneMessage(null);
    setAvailableNumbers([]);
    try {
      const res = await fetch(`/api/chatbots/${chatbotId}/voice/phone-number`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search",
          country: "US",
          areaCode: phoneAreaCode || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAvailableNumbers(data.data);
        if (data.data.length === 0) {
          setPhoneMessage({
            type: "error",
            text: "No numbers found. Try a different area code.",
          });
        }
      } else {
        setPhoneMessage({ type: "error", text: data.error });
      }
    } catch {
      setPhoneMessage({ type: "error", text: "Failed to search numbers" });
    } finally {
      setIsSearchingNumbers(false);
    }
  };

  const purchasePhone = async (phoneNumber: string) => {
    setIsPurchasing(true);
    setPhoneMessage(null);
    try {
      const res = await fetch(`/api/chatbots/${chatbotId}/voice/phone-number`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purchase", phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig((prev) => ({
          ...prev,
          twilioPhoneNumber: data.data.phoneNumber,
        }));
        setAvailableNumbers([]);
        setPhoneAreaCode("");
        setPhoneMessage({
          type: "success",
          text: "Phone number provisioned successfully",
        });
      } else {
        setPhoneMessage({ type: "error", text: data.error });
      }
    } catch {
      setPhoneMessage({ type: "error", text: "Failed to purchase number" });
    } finally {
      setIsPurchasing(false);
    }
  };

  const releasePhone = async () => {
    if (
      !confirm(
        "Release this phone number? Callers will no longer be able to reach your AI receptionist at this number.",
      )
    ) {
      return;
    }
    setIsReleasing(true);
    setPhoneMessage(null);
    try {
      const res = await fetch(`/api/chatbots/${chatbotId}/voice/phone-number`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setConfig((prev) => ({
          ...prev,
          twilioPhoneNumber: null,
          enabled: false,
        }));
        setPhoneMessage({
          type: "success",
          text: "Phone number released",
        });
      } else {
        setPhoneMessage({ type: "error", text: data.error });
      }
    } catch {
      setPhoneMessage({ type: "error", text: "Failed to release number" });
    } finally {
      setIsReleasing(false);
    }
  };

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [configRes, voicesRes, usageRes] = await Promise.all([
        fetch(`/api/chatbots/${chatbotId}/voice`, { credentials: "include" }),
        fetch(`/api/chatbots/${chatbotId}/voice/voices`, {
          credentials: "include",
        }),
        fetch(`/api/chatbots/${chatbotId}/voice/usage`, {
          credentials: "include",
        }),
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.success && configData.data) {
          setConfig({ ...DEFAULT_CONFIG, ...configData.data });
        }
      }

      if (voicesRes.ok) {
        const voicesData = await voicesRes.json();
        if (voicesData.success) {
          setVoices(voicesData.data);
        }
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        if (usageData.success) {
          setUsage(usageData.data);
        }
      }
    } catch {
      setSaveMessage({ type: "error", text: "Failed to load voice settings" });
    } finally {
      setIsLoading(false);
    }
  }, [chatbotId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateConfig = <K extends keyof VoiceConfig>(
    key: K,
    value: VoiceConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/chatbots/${chatbotId}/voice`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error("Failed to save");

      const result = await res.json();
      if (result.success) {
        setConfig({ ...DEFAULT_CONFIG, ...result.data });
        setHasChanges(false);
        setSaveMessage({ type: "success", text: "Voice settings saved" });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Failed to save voice settings" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
      </div>
    );
  }

  return (
    <PlanGate requiredFeature="voice_receptionist">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-brand-muted">
              Configure your AI voice receptionist to handle inbound calls
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/chatbots/${chatbotId}/voice/calls`}
              className="btn-secondary inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call History
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="bg-gradient-accent inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-brand-primary shadow-md hover:shadow-lg transition-all hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>

        {/* Save feedback */}
        {saveMessage && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
              saveMessage.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {saveMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {saveMessage.text}
          </div>
        )}

        {/* Usage */}
        {usage && <UsageBar usage={usage} />}

        {/* Enable Toggle */}
        <div className="bg-white rounded-xl border border-brand-border elevation-1 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Phone className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-primary">
                  Voice Receptionist
                </p>
                <p className="text-xs text-brand-muted">
                  {config.enabled
                    ? "Active — receiving inbound calls"
                    : "Disabled — enable to start receiving calls"}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.enabled}
              onClick={() => updateConfig("enabled", !config.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enabled ? "bg-emerald-500" : "bg-brand-border"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  config.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Phone Number */}
        <div className="bg-white rounded-xl border border-brand-border elevation-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-4 w-4 text-brand-muted" />
            <h3 className="text-sm font-semibold text-brand-primary">
              Phone Number
            </h3>
          </div>

          {phoneMessage && (
            <div
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm mb-4 ${
                phoneMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {phoneMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {phoneMessage.text}
            </div>
          )}

          {config.twilioPhoneNumber ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-muted mb-1">Assigned Number</p>
                <p className="text-lg font-semibold text-brand-primary tracking-wide">
                  {config.twilioPhoneNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={releasePhone}
                disabled={isReleasing}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
              >
                {isReleasing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Release
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-brand-muted">
                Get a phone number for your AI receptionist. Callers to this
                number will be connected to your chatbot.
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:max-w-xs">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                  <input
                    type="text"
                    value={phoneAreaCode}
                    onChange={(e) =>
                      setPhoneAreaCode(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Area code (e.g. 415)"
                    maxLength={3}
                    className="w-full pl-9 pr-3 py-2.5 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
                <button
                  type="button"
                  onClick={searchNumbers}
                  disabled={isSearchingNumbers}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-surface hover:bg-brand-border border border-brand-border text-brand-primary transition-colors disabled:opacity-50"
                >
                  {isSearchingNumbers ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </button>
              </div>

              {availableNumbers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-brand-muted">
                    Available Numbers
                  </p>
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {availableNumbers.map((num) => (
                      <div
                        key={num.phoneNumber}
                        className="flex items-center justify-between p-3 rounded-lg border border-brand-border hover:border-brand-muted transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-brand-primary">
                            {num.friendlyName}
                          </p>
                          <p className="text-xs text-brand-muted">
                            {[num.locality, num.region]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => purchasePhone(num.phoneNumber)}
                          disabled={isPurchasing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-accent text-brand-primary hover:brightness-105 transition-all disabled:opacity-50"
                        >
                          {isPurchasing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Phone className="h-3.5 w-3.5" />
                          )}
                          Get Number
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Voice Selection */}
        <div className="bg-white rounded-xl border border-brand-border elevation-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="h-4 w-4 text-brand-muted" />
            <h3 className="text-sm font-semibold text-brand-primary">Voice</h3>
          </div>
          <p className="text-xs text-brand-muted mb-4">
            Choose the voice your AI receptionist will use when speaking to
            callers.
          </p>
          {voices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {voices.slice(0, 12).map((voice) => (
                <VoiceCard
                  key={voice.id}
                  voice={voice}
                  selected={config.voiceId === voice.id}
                  onSelect={() => {
                    updateConfig("voiceId", voice.id);
                    updateConfig("voiceName", voice.name);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-brand-muted">
              No voices available. Check your ElevenLabs configuration.
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="bg-white rounded-xl border border-brand-border elevation-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="h-4 w-4 text-brand-muted" />
            <h3 className="text-sm font-semibold text-brand-primary">
              Messages
            </h3>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-primary mb-2">
                Greeting Message
              </label>
              <p className="text-xs text-brand-muted mb-2">
                What the AI says when answering a call.
              </p>
              <textarea
                value={config.greetingMessage}
                onChange={(e) =>
                  updateConfig("greetingMessage", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2.5 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none"
                placeholder="Hello! Thank you for calling..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-primary mb-2">
                Voicemail Message
              </label>
              <p className="text-xs text-brand-muted mb-2">
                Played when calls are outside business hours (optional).
              </p>
              <textarea
                value={config.voiceMailMessage ?? ""}
                onChange={(e) =>
                  updateConfig("voiceMailMessage", e.target.value || null)
                }
                rows={3}
                className="w-full px-3 py-2.5 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none"
                placeholder="Sorry, we're currently closed. Please leave a message..."
              />
            </div>
          </div>
        </div>

        {/* Call Settings */}
        <div className="bg-white rounded-xl border border-brand-border elevation-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-brand-muted" />
            <h3 className="text-sm font-semibold text-brand-primary">
              Call Settings
            </h3>
          </div>
          <div className="space-y-6">
            {/* Max Duration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-brand-primary">
                  Max Call Duration
                </label>
                <span className="text-sm font-medium text-brand-primary tabular-nums">
                  {Math.round(config.maxCallDurationSeconds / 60)} min
                </span>
              </div>
              <input
                type="range"
                min={60}
                max={1800}
                step={60}
                value={config.maxCallDurationSeconds}
                onChange={(e) =>
                  updateConfig(
                    "maxCallDurationSeconds",
                    parseInt(e.target.value, 10),
                  )
                }
                className="w-full accent-[#ffab7a]"
              />
              <div className="flex justify-between text-xs text-brand-muted mt-1">
                <span>1 min</span>
                <span>30 min</span>
              </div>
            </div>

            {/* Silence Timeout */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-brand-primary">
                  Silence Timeout
                </label>
                <span className="text-sm font-medium text-brand-primary tabular-nums">
                  {config.silenceTimeoutSeconds}s
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={config.silenceTimeoutSeconds}
                onChange={(e) =>
                  updateConfig(
                    "silenceTimeoutSeconds",
                    parseInt(e.target.value, 10),
                  )
                }
                className="w-full accent-[#ffab7a]"
              />
              <div className="flex justify-between text-xs text-brand-muted mt-1">
                <span>5s</span>
                <span>30s</span>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-brand-primary mb-2">
                Language
              </label>
              <select
                value={config.language}
                onChange={(e) => updateConfig("language", e.target.value)}
                className="w-full sm:w-64 px-3 py-2.5 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-white rounded-xl border border-brand-border elevation-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-brand-muted" />
            <h3 className="text-sm font-semibold text-brand-primary">
              Business Hours
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-primary">
                  Enable business hours
                </p>
                <p className="text-xs text-brand-muted">
                  Calls outside business hours will hear your voicemail message.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.businessHours !== null}
                onClick={() => {
                  if (config.businessHours) {
                    updateConfig("businessHours", null);
                  } else {
                    updateConfig(
                      "businessHours",
                      DEFAULT_BUSINESS_HOURS as unknown as Record<
                        string,
                        unknown
                      >,
                    );
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.businessHours ? "bg-emerald-500" : "bg-brand-border"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    config.businessHours ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {config.businessHours &&
              (() => {
                const bh = config.businessHours as unknown as BusinessHoursData;

                const updateBH = (updated: BusinessHoursData) => {
                  updateConfig(
                    "businessHours",
                    updated as unknown as Record<string, unknown>,
                  );
                };

                return (
                  <div className="space-y-4 pt-2">
                    {/* Timezone */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-brand-primary mb-2">
                        <Globe className="h-3.5 w-3.5" />
                        Timezone
                      </label>
                      <select
                        value={bh.timezone}
                        onChange={(e) =>
                          updateBH({ ...bh, timezone: e.target.value })
                        }
                        className="w-full sm:w-80 px-3 py-2.5 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      >
                        {COMMON_TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Apply Monday to weekdays */}
                    {bh.schedule.mon && (
                      <button
                        type="button"
                        onClick={() => {
                          const mon = bh.schedule.mon;
                          if (!mon) return;
                          const newSchedule = { ...bh.schedule };
                          const weekdays: DayAbbr[] = [
                            "tue",
                            "wed",
                            "thu",
                            "fri",
                          ];
                          for (const day of weekdays) {
                            newSchedule[day] = {
                              start: mon.start,
                              end: mon.end,
                            };
                          }
                          updateBH({ ...bh, schedule: newSchedule });
                        }}
                        className="text-xs font-medium text-brand-blue hover:text-brand-blue/80 transition-colors"
                      >
                        Apply Monday hours to all weekdays
                      </button>
                    )}

                    {/* Day Grid */}
                    <div className="space-y-2">
                      {DAYS.map(({ key, label }) => {
                        const daySchedule = bh.schedule[key];
                        const isOpen = !!daySchedule;

                        return (
                          <div
                            key={key}
                            className="flex items-center gap-3 py-1.5"
                          >
                            <label className="flex items-center gap-2 w-16 shrink-0">
                              <input
                                type="checkbox"
                                checked={isOpen}
                                onChange={() => {
                                  const newSchedule = { ...bh.schedule };
                                  if (isOpen) {
                                    delete newSchedule[key];
                                  } else {
                                    newSchedule[key] = {
                                      start: "09:00",
                                      end: "17:00",
                                    };
                                  }
                                  updateBH({ ...bh, schedule: newSchedule });
                                }}
                                className="rounded border-brand-border text-[#ffab7a] focus:ring-[#ffab7a]"
                              />
                              <span
                                className={`text-sm font-medium ${isOpen ? "text-brand-primary" : "text-brand-muted"}`}
                              >
                                {label}
                              </span>
                            </label>

                            {isOpen ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={daySchedule.start}
                                  onChange={(e) => {
                                    const newSchedule = { ...bh.schedule };
                                    newSchedule[key] = {
                                      ...daySchedule,
                                      start: e.target.value,
                                    };
                                    updateBH({ ...bh, schedule: newSchedule });
                                  }}
                                  className="px-2 py-1.5 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                >
                                  {TIME_OPTIONS.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-xs text-brand-muted">
                                  to
                                </span>
                                <select
                                  value={daySchedule.end}
                                  onChange={(e) => {
                                    const newSchedule = { ...bh.schedule };
                                    newSchedule[key] = {
                                      ...daySchedule,
                                      end: e.target.value,
                                    };
                                    updateBH({ ...bh, schedule: newSchedule });
                                  }}
                                  className="px-2 py-1.5 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                >
                                  {TIME_OPTIONS.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <span className="text-xs text-brand-muted italic">
                                Closed
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>

        {/* Transfer Settings */}
        <div className="bg-white rounded-xl border border-brand-border elevation-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PhoneForwarded className="h-4 w-4 text-brand-muted" />
            <h3 className="text-sm font-semibold text-brand-primary">
              Call Transfer
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-primary">
                  Enable call transfer
                </p>
                <p className="text-xs text-brand-muted">
                  Allow the AI to transfer calls to a live agent when requested.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.transferEnabled}
                onClick={() =>
                  updateConfig("transferEnabled", !config.transferEnabled)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.transferEnabled ? "bg-emerald-500" : "bg-brand-border"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    config.transferEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {config.transferEnabled && (
              <div>
                <label className="block text-sm font-medium text-brand-primary mb-2">
                  Transfer Phone Number
                </label>
                <input
                  type="tel"
                  value={config.transferPhoneNumber ?? ""}
                  onChange={(e) =>
                    updateConfig("transferPhoneNumber", e.target.value || null)
                  }
                  placeholder="+1 (555) 000-0000"
                  className="w-full sm:w-80 px-3 py-2.5 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
              </div>
            )}
          </div>
        </div>

        {/* Recording */}
        <div className="bg-white rounded-xl border border-brand-border elevation-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-brand-muted" />
            <h3 className="text-sm font-semibold text-brand-primary">
              Recording
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-primary">
                Record calls
              </p>
              <p className="text-xs text-brand-muted">
                Calls will include a consent disclaimer. Recordings are stored
                securely.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.recordingEnabled}
              onClick={() =>
                updateConfig("recordingEnabled", !config.recordingEnabled)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.recordingEnabled ? "bg-emerald-500" : "bg-brand-border"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  config.recordingEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </PlanGate>
  );
}

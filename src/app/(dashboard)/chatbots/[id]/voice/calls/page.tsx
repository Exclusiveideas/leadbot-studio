"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  UserPlus,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmptyState from "@/components/dashboard/EmptyState";

type VoiceCall = {
  id: string;
  twilioCallSid: string;
  direction: "INBOUND" | "OUTBOUND";
  status: string;
  callerNumber: string | null;
  callerCity: string | null;
  callerState: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  leadCaptured: boolean;
  summary: string | null;
};

type VoiceCallDetail = VoiceCall & {
  callerCountry: string | null;
  calledNumber: string | null;
  transcript: Array<{
    role: string;
    content: string;
    timestamp?: string;
  }> | null;
  recordingUrl: string | null;
  transferredTo: string | null;
  transferredAt: string | null;
  costCents: number | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "COMPLETED", label: "Completed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "FAILED", label: "Failed" },
  { value: "NO_ANSWER", label: "No Answer" },
  { value: "BUSY", label: "Busy" },
  { value: "CANCELED", label: "Canceled" },
];

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    RINGING: "bg-amber-50 text-amber-700",
    FAILED: "bg-red-50 text-red-700",
    NO_ANSWER: "bg-gray-100 text-gray-700",
    BUSY: "bg-orange-50 text-orange-700",
    CANCELED: "bg-gray-100 text-gray-600",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {label.charAt(0) + label.slice(1).toLowerCase()}
    </span>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CallHistoryPage() {
  const params = useParams();
  const chatbotId = params.id as string;

  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCall, setSelectedCall] = useState<VoiceCallDetail | null>(
    null,
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchCalls = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(
          `/api/chatbots/${chatbotId}/voice/calls?${params}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Failed to fetch calls");

        const result = await res.json();
        if (result.success) {
          setCalls(result.data);
          setPagination(result.pagination);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load calls");
      } finally {
        setIsLoading(false);
      }
    },
    [chatbotId, statusFilter],
  );

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const openCallDetail = async (callId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(
        `/api/chatbots/${chatbotId}/voice/calls/${callId}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch call");
      const result = await res.json();
      if (result.success) {
        setSelectedCall(result.data);
      }
    } catch {
      // silently fail, user can try again
    } finally {
      setIsLoadingDetail(false);
    }
  };

  if (error && !calls.length) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/chatbots/${chatbotId}/voice`}
            className="inline-flex items-center text-sm text-brand-muted hover:text-brand-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voice Settings
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchCalls(pagination.page)}
            disabled={isLoading}
            className="btn-secondary inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-brand-muted">
        {pagination.total} call{pagination.total !== 1 ? "s" : ""}
        {statusFilter
          ? ` (${statusFilter.toLowerCase().replace(/_/g, " ")})`
          : ""}
      </p>

      {/* Calls Table */}
      {isLoading && !calls.length ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
        </div>
      ) : calls.length === 0 ? (
        <EmptyState
          icon={Phone}
          title="No calls yet"
          description="Voice calls will appear here once your AI receptionist starts receiving calls."
        />
      ) : (
        <div className="bg-white rounded-xl elevation-1 overflow-hidden border border-brand-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-border">
              <thead className="bg-brand-surface">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                    Caller
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                    Lead
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-brand-border">
                {calls.map((call) => (
                  <tr
                    key={call.id}
                    onClick={() => openCallDetail(call.id)}
                    className="hover:bg-brand-surface transition-colors cursor-pointer"
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-brand-surface flex items-center justify-center shrink-0">
                          {call.direction === "INBOUND" ? (
                            <PhoneIncoming className="h-4 w-4 text-brand-muted" />
                          ) : (
                            <PhoneOutgoing className="h-4 w-4 text-brand-muted" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-brand-primary">
                            {call.callerNumber ?? "Unknown"}
                          </p>
                          {(call.callerCity || call.callerState) && (
                            <p className="text-xs text-brand-muted">
                              {[call.callerCity, call.callerState]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {getStatusBadge(call.status)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-brand-muted">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(call.durationSeconds)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-brand-muted">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(call.startedAt)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {call.leadCaptured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <UserPlus className="h-3 w-3" />
                          Captured
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-brand-border bg-brand-surface">
              <p className="text-xs text-brand-muted">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchCalls(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg border border-brand-border bg-white hover:bg-brand-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 text-brand-primary" />
                </button>
                <button
                  onClick={() => fetchCalls(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg border border-brand-border bg-white hover:bg-brand-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4 text-brand-primary" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Call Detail Modal */}
      <Dialog
        open={!!selectedCall || isLoadingDetail}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCall(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden border-0 focus:outline-none focus-visible:outline-none">
          {isLoadingDetail && !selectedCall ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
            </div>
          ) : selectedCall ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  {selectedCall.direction === "INBOUND" ? (
                    <PhoneIncoming className="h-5 w-5 text-brand-muted" />
                  ) : (
                    <PhoneOutgoing className="h-5 w-5 text-brand-muted" />
                  )}
                  {selectedCall.callerNumber ?? "Unknown Caller"}
                </DialogTitle>
                <DialogDescription>
                  {formatDate(selectedCall.startedAt)} &middot;{" "}
                  {formatDuration(selectedCall.durationSeconds)}
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-y-auto max-h-[calc(80vh-140px)] space-y-6 py-4">
                {/* Call Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-brand-surface rounded-xl p-3">
                    <p className="text-xs text-brand-muted mb-1">Status</p>
                    {getStatusBadge(selectedCall.status)}
                  </div>
                  <div className="bg-brand-surface rounded-xl p-3">
                    <p className="text-xs text-brand-muted mb-1">Duration</p>
                    <p className="text-sm font-medium text-brand-primary">
                      {formatDuration(selectedCall.durationSeconds)}
                    </p>
                  </div>
                  <div className="bg-brand-surface rounded-xl p-3">
                    <p className="text-xs text-brand-muted mb-1">Direction</p>
                    <p className="text-sm font-medium text-brand-primary">
                      {selectedCall.direction.charAt(0) +
                        selectedCall.direction.slice(1).toLowerCase()}
                    </p>
                  </div>
                  {(selectedCall.callerCity || selectedCall.callerState) && (
                    <div className="bg-brand-surface rounded-xl p-3">
                      <p className="text-xs text-brand-muted mb-1">Location</p>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-brand-muted" />
                        <p className="text-sm font-medium text-brand-primary">
                          {[
                            selectedCall.callerCity,
                            selectedCall.callerState,
                            selectedCall.callerCountry,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedCall.leadCaptured && (
                    <div className="bg-emerald-50 rounded-xl p-3">
                      <p className="text-xs text-emerald-600 mb-1">Lead</p>
                      <div className="flex items-center gap-1">
                        <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
                        <p className="text-sm font-medium text-emerald-700">
                          Captured
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedCall.transferredTo && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-blue-600 mb-1">
                        Transferred To
                      </p>
                      <p className="text-sm font-medium text-blue-700">
                        {selectedCall.transferredTo}
                      </p>
                    </div>
                  )}
                </div>

                {/* Summary */}
                {selectedCall.summary && (
                  <div>
                    <h3 className="text-sm font-semibold text-brand-primary mb-2">
                      Call Summary
                    </h3>
                    <p className="text-sm text-brand-primary bg-brand-surface rounded-xl p-4 leading-relaxed">
                      {selectedCall.summary}
                    </p>
                  </div>
                )}

                {/* Recording */}
                {selectedCall.recordingUrl && (
                  <div>
                    <h3 className="text-sm font-semibold text-brand-primary mb-2">
                      Recording
                    </h3>
                    <div className="bg-brand-surface rounded-xl p-4">
                      <audio
                        controls
                        preload="metadata"
                        className="w-full"
                        src={selectedCall.recordingUrl}
                      >
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  </div>
                )}

                {/* Transcript */}
                {selectedCall.transcript &&
                selectedCall.transcript.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-brand-primary mb-3">
                      Transcript ({selectedCall.transcript.length} messages)
                    </h3>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {selectedCall.transcript.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl ${
                            msg.role === "user"
                              ? "bg-brand-surface ml-8"
                              : "bg-brand-blue/5 mr-8"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="text-xs font-medium text-brand-muted">
                              {msg.role === "user"
                                ? "Caller"
                                : "AI Receptionist"}
                            </span>
                            {msg.timestamp && (
                              <span className="text-xs text-brand-light">
                                {formatTime(msg.timestamp)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-brand-primary whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-brand-border rounded-xl p-8 text-center">
                    <Phone className="h-8 w-8 text-brand-light mx-auto mb-2" />
                    <p className="text-sm text-brand-muted">
                      No transcript available for this call
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Mail,
  Phone,
  User,
  Calendar,
  Download,
  RefreshCw,
  MapPin,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Booking = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  categoryName: string;
  subCategoryName: string | null;
  caseDescription: string | null;
  locationName: string;
  locationAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  status: BookingStatus;
  createdAt: string;
};

type BookingStats = {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
};

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
};

export default function BookingsPage() {
  const params = useParams();
  const chatbotId = params.id as string;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "case" | "appointment">("overview");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [chatbotId, statusFilter]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const statusParam = statusFilter !== "ALL" ? `&status=${statusFilter}` : "";
      const response = await fetch(
        `/api/chatbots/${chatbotId}/bookings?limit=100${statusParam}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const result = await response.json();
      setBookings(result.data);
      setTotal(result.total);
      setStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    setUpdatingStatus(bookingId);
    try {
      const response = await fetch(
        `/api/chatbots/${chatbotId}/bookings/${bookingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update booking status");
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );

      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToCSV = () => {
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Category",
      "Sub-Category",
      "Location",
      "Address",
      "Date",
      "Time",
      "Status",
      "Case Description",
      "Created At",
    ];

    const rows = bookings.map((booking) => [
      booking.firstName,
      booking.lastName,
      booking.email,
      booking.phone,
      booking.categoryName,
      booking.subCategoryName || "",
      booking.locationName,
      booking.locationAddress,
      formatDate(booking.appointmentDate),
      booking.appointmentTime,
      booking.status,
      booking.caseDescription || "",
      formatDateTime(booking.createdAt),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chatbot-bookings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-yellow-600 uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-semibold text-yellow-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-blue-600 uppercase tracking-wide">Confirmed</p>
            <p className="text-2xl font-semibold text-blue-600 mt-1">{stats.confirmed}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-green-600 uppercase tracking-wide">Completed</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-red-600 uppercase tracking-wide">Cancelled</p>
            <p className="text-2xl font-semibold text-red-600 mt-1">{stats.cancelled}</p>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "ALL")}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <p className="text-gray-500 text-sm">
            {total} booking{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bookings.length > 0 && (
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          )}
          <button
            onClick={fetchBookings}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Reload
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bookings will appear here when visitors schedule appointments through your chatbot.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => {
                  const statusConfig = STATUS_CONFIG[booking.status];
                  return (
                    <tr
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <User className="h-4 w-4 text-gray-500" />
                            {booking.firstName} {booking.lastName}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {booking.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {booking.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.categoryName}
                          </div>
                          {booking.subCategoryName && (
                            <div className="text-sm text-gray-500">
                              {booking.subCategoryName}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            {formatDate(booking.appointmentDate)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            {booking.appointmentTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            {booking.locationName}
                          </div>
                          <div className="text-sm text-gray-500 max-w-[200px] truncate">
                            {booking.locationAddress}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={booking.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateBookingStatus(booking.id, e.target.value as BookingStatus);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={updatingStatus === booking.id}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color} border-0 cursor-pointer disabled:opacity-50`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        {updatingStatus === booking.id && (
                          <Loader2 className="h-4 w-4 animate-spin ml-2 inline" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDateTime(booking.createdAt)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      <Dialog
        open={!!selectedBooking}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBooking(null);
            setActiveTab("overview");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden border-0 focus:outline-none focus-visible:outline-none">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedBooking.firstName} {selectedBooking.lastName}
                </DialogTitle>
                <DialogDescription>
                  Booking for {selectedBooking.categoryName}
                </DialogDescription>
              </DialogHeader>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "overview"
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("case")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "case"
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Case Details
                  </button>
                  <button
                    onClick={() => setActiveTab("appointment")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "appointment"
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Appointment
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="overflow-y-auto max-h-[calc(80vh-180px)] py-4">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Contact Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Name</p>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedBooking.firstName} {selectedBooking.lastName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedBooking.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedBooking.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Status
                      </h3>
                      <div className="flex items-center gap-3">
                        <select
                          value={selectedBooking.status}
                          onChange={(e) =>
                            updateBookingStatus(selectedBooking.id, e.target.value as BookingStatus)
                          }
                          disabled={updatingStatus === selectedBooking.id}
                          className={`px-3 py-2 rounded-md text-sm font-medium ${STATUS_CONFIG[selectedBooking.status].color} border-0`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        {updatingStatus === selectedBooking.id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Submitted
                      </h3>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">
                          {formatDateTime(selectedBooking.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Case Details Tab */}
                {activeTab === "case" && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs text-gray-500">Category</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {selectedBooking.categoryName}
                      </p>
                    </div>
                    {selectedBooking.subCategoryName && (
                      <div>
                        <label className="text-xs text-gray-500">Sub-Category</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {selectedBooking.subCategoryName}
                        </p>
                      </div>
                    )}
                    {selectedBooking.caseDescription ? (
                      <div>
                        <label className="text-xs text-gray-500">Case Description</label>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                            {selectedBooking.caseDescription}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                          No case description provided
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Appointment Tab */}
                {activeTab === "appointment" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-5 w-5 text-gray-500" />
                          <p className="text-xs text-gray-500">Date</p>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatDate(selectedBooking.appointmentDate)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5 text-gray-500" />
                          <p className="text-xs text-gray-500">Time</p>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedBooking.appointmentTime}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Location
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedBooking.locationName}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {selectedBooking.locationAddress}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

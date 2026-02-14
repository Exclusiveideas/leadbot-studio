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
  MessageSquare,
  MessageCircle,
  CheckCircle2,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MarkdownContent from "@/components/chat/MarkdownContent";
import "@/app/(dashboard)/generate/components/chat/chat-markdown.css";

type ConversationMessage = {
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  localId?: string;
};

type Lead = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  caseType: string | null;
  urgency: string | null;
  budget: string | null;
  notes: string | null;
  source?: "LEAD_FORM" | "BOOKING_FALLBACK";
  capturedAt: string;
  conversationSnapshot?: {
    messages: ConversationMessage[];
    capturedAt: string;
    sessionId: string;
  } | null;
  conversation: {
    id: string;
    startedAt: string;
    _count: {
      messages: number;
    };
  } | null;
};

type TextRequest = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  message: string;
  status: "PENDING" | "SEEN" | "RESPONDED";
  createdAt: string;
};

export default function LeadsPage() {
  const params = useParams();
  const chatbotId = params.id as string;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [contacts, setContacts] = useState<Lead[]>([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [textRequests, setTextRequests] = useState<TextRequest[]>([]);
  const [textRequestsTotal, setTextRequestsTotal] = useState(0);
  const [selectedTextRequest, setSelectedTextRequest] =
    useState<TextRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "case" | "conversation"
  >("overview");

  useEffect(() => {
    fetchData();
  }, [chatbotId]);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchLeads(), fetchContacts(), fetchTextRequests()]);
    setIsLoading(false);
  };

  const fetchLeads = async () => {
    try {
      const response = await fetch(
        `/api/chatbots/${chatbotId}/leads?source=LEAD_FORM`,
        { credentials: "include" },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch leads");
      }

      const result = await response.json();
      if (result.success) {
        setLeads(result.data.leads);
        setTotal(result.data.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch(
        `/api/chatbots/${chatbotId}/leads?source=BOOKING_FALLBACK`,
        { credentials: "include" },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }

      const result = await response.json();
      if (result.success) {
        setContacts(result.data.leads);
        setContactsTotal(result.data.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contacts");
    }
  };

  const fetchTextRequests = async () => {
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/text-requests`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch text requests");
      }

      const result = await response.json();
      if (result.data) {
        setTextRequests(result.data);
        setTextRequestsTotal(result.total ?? 0);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load text requests",
      );
    }
  };

  const updateTextRequestStatus = async (
    textRequestId: string,
    status: "SEEN" | "RESPONDED",
  ) => {
    try {
      const response = await fetch(
        `/api/chatbots/${chatbotId}/text-requests/${textRequestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        setTextRequests((prev) =>
          prev.map((tr) => (tr.id === textRequestId ? { ...tr, status } : tr)),
        );
        if (selectedTextRequest?.id === textRequestId) {
          setSelectedTextRequest((prev) => (prev ? { ...prev, status } : null));
        }
      }
    } catch (err) {
      console.error("Failed to update text request status:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTextRequestStatusColor = (status: TextRequest["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "SEEN":
        return "bg-blue-100 text-blue-800";
      case "RESPONDED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTextRequestStatusIcon = (status: TextRequest["status"]) => {
    switch (status) {
      case "PENDING":
        return <MessageCircle className="h-3 w-3" />;
      case "SEEN":
        return <Eye className="h-3 w-3" />;
      case "RESPONDED":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const exportToCSV = (data: Lead[], filename: string) => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Case Type",
      "Urgency",
      "Budget",
      "Notes",
      "Captured At",
    ];

    const rows = data.map((lead) => [
      lead.name || "",
      lead.email,
      lead.phone || "",
      lead.caseType || "",
      lead.urgency || "",
      lead.budget || "",
      lead.notes || "",
      formatDate(lead.capturedAt),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportTextRequestsToCSV = () => {
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Message",
      "Status",
      "Submitted At",
    ];

    const rows = textRequests.map((tr) => [
      tr.firstName,
      tr.lastName,
      tr.email || "",
      tr.phone,
      tr.message,
      tr.status,
      formatDate(tr.createdAt),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `text-requests-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
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
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500">
            {total} lead{total !== 1 ? "s" : ""}, {contactsTotal} contact
            {contactsTotal !== 1 ? "s" : ""}, {textRequestsTotal} text request
            {textRequestsTotal !== 1 ? "s" : ""} captured
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Reload
        </button>
      </div>

      {/* Leads Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Leads ({total})
          </h2>
          {leads.length > 0 && (
            <button
              onClick={() => exportToCSV(leads, "chatbot-leads")}
              className="inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="h-3 w-3 mr-1.5" />
              Export
            </button>
          )}
        </div>
        {leads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
            <User className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leads</h3>
            <p className="mt-1 text-sm text-gray-500">
              Leads will appear here when visitors provide their contact
              information.
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
                      Case Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Captured
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {lead.name && (
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                              <User className="h-4 w-4 text-gray-500" />
                              {lead.name}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail className="h-4 w-4 text-gray-500" />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="h-4 w-4 text-gray-500" />
                              {lead.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {lead.caseType && (
                            <div className="text-sm text-gray-900">
                              <span className="font-medium">Type:</span>{" "}
                              {lead.caseType}
                            </div>
                          )}
                          {lead.urgency && (
                            <div>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(lead.urgency)}`}
                              >
                                {lead.urgency.charAt(0).toUpperCase() +
                                  lead.urgency.slice(1)}
                              </span>
                            </div>
                          )}
                          {lead.budget && (
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Budget:</span>{" "}
                              {lead.budget}
                            </div>
                          )}
                          {lead.notes && (
                            <div className="text-sm text-gray-500 mt-2">
                              <span className="font-medium">Notes:</span>{" "}
                              {lead.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {formatDate(lead.capturedAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Contacts Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Contacts ({contactsTotal})
          </h2>
          {contacts.length > 0 && (
            <button
              onClick={() => exportToCSV(contacts, "chatbot-contacts")}
              className="inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="h-3 w-3 mr-1.5" />
              Export
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Contacts captured from booking requests when no Calendly link is
          configured.
        </p>
        {contacts.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-200">
            <Phone className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No contacts
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Contacts will appear here when visitors request to book a call.
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
                      Captured
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => setSelectedLead(contact)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {contact.name && (
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                              <User className="h-4 w-4 text-gray-500" />
                              {contact.name}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail className="h-4 w-4 text-gray-500" />
                            {contact.email}
                          </div>
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="h-4 w-4 text-gray-500" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {formatDate(contact.capturedAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Text Requests Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Text Requests ({textRequestsTotal})
          </h2>
          {textRequests.length > 0 && (
            <button
              onClick={exportTextRequestsToCSV}
              className="inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="h-3 w-3 mr-1.5" />
              Export
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Messages from visitors who used the "Send us a Text" feature.
        </p>
        {textRequests.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-200">
            <MessageCircle className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No text requests
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Text requests will appear here when visitors use the "Send us a
              Text" feature.
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
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {textRequests.map((textRequest) => (
                    <tr
                      key={textRequest.id}
                      onClick={() => {
                        setSelectedTextRequest(textRequest);
                        if (textRequest.status === "PENDING") {
                          updateTextRequestStatus(textRequest.id, "SEEN");
                        }
                      }}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <User className="h-4 w-4 text-gray-500" />
                            {textRequest.firstName} {textRequest.lastName}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="h-4 w-4 text-gray-500" />
                            {textRequest.phone}
                          </div>
                          {textRequest.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Mail className="h-4 w-4 text-gray-500" />
                              {textRequest.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 max-w-xs truncate">
                          {textRequest.message}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTextRequestStatusColor(textRequest.status)}`}
                        >
                          {getTextRequestStatusIcon(textRequest.status)}
                          {textRequest.status.charAt(0) +
                            textRequest.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {formatDate(textRequest.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Text Request Details Modal */}
      <Dialog
        open={!!selectedTextRequest}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTextRequest(null);
          }
        }}
      >
        <DialogContent className="max-w-lg border-0 focus:outline-none focus-visible:outline-none">
          {selectedTextRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedTextRequest.firstName} {selectedTextRequest.lastName}
                </DialogTitle>
                <DialogDescription>
                  Text request received{" "}
                  {formatDate(selectedTextRequest.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedTextRequest.phone}
                        </p>
                      </div>
                    </div>
                    {selectedTextRequest.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedTextRequest.email}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Message
                  </h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {selectedTextRequest.message}
                  </p>
                </div>

                {/* Status */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Status
                  </h3>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTextRequestStatusColor(selectedTextRequest.status)}`}
                    >
                      {getTextRequestStatusIcon(selectedTextRequest.status)}
                      {selectedTextRequest.status.charAt(0) +
                        selectedTextRequest.status.slice(1).toLowerCase()}
                    </span>
                    {selectedTextRequest.status !== "RESPONDED" && (
                      <button
                        onClick={() =>
                          updateTextRequestStatus(
                            selectedTextRequest.id,
                            "RESPONDED",
                          )
                        }
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark as Responded
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Lead Details Modal */}
      <Dialog
        open={!!selectedLead}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLead(null);
            setActiveTab("overview");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden border-0 focus:outline-none focus-visible:outline-none">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedLead.name || "Lead Details"}
                </DialogTitle>
                <DialogDescription>{selectedLead.email}</DialogDescription>
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
                    onClick={() => setActiveTab("conversation")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "conversation"
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Conversation
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
                        {selectedLead.name && (
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Name</p>
                              <p className="text-sm font-medium text-gray-900">
                                {selectedLead.name}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedLead.email}
                            </p>
                          </div>
                        </div>
                        {selectedLead.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Phone</p>
                              <p className="text-sm font-medium text-gray-900">
                                {selectedLead.phone}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Quick Info
                      </h3>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Captured</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(selectedLead.capturedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Case Details Tab */}
                {activeTab === "case" && (
                  <div className="space-y-6">
                    {selectedLead.caseType && (
                      <div>
                        <label className="text-xs text-gray-500">
                          Case Type
                        </label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {selectedLead.caseType}
                        </p>
                      </div>
                    )}
                    {selectedLead.urgency && (
                      <div>
                        <label className="text-xs text-gray-500">Urgency</label>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(selectedLead.urgency)}`}
                          >
                            {selectedLead.urgency.charAt(0).toUpperCase() +
                              selectedLead.urgency.slice(1)}
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedLead.budget && (
                      <div>
                        <label className="text-xs text-gray-500">Budget</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {selectedLead.budget}
                        </p>
                      </div>
                    )}
                    {selectedLead.notes && (
                      <div>
                        <label className="text-xs text-gray-500">Notes</label>
                        <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap leading-relaxed">
                          {selectedLead.notes}
                        </p>
                      </div>
                    )}
                    {!selectedLead.caseType &&
                      !selectedLead.urgency &&
                      !selectedLead.budget &&
                      !selectedLead.notes && (
                        <p className="text-sm text-gray-500 text-center py-8">
                          No case details available
                        </p>
                      )}
                  </div>
                )}

                {/* Conversation Tab */}
                {activeTab === "conversation" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">
                          Total Messages
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {selectedLead.conversationSnapshot?.messages.length ??
                            selectedLead.conversation?._count?.messages ??
                            0}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Captured</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(selectedLead.capturedAt)}
                        </p>
                      </div>
                    </div>

                    {selectedLead.conversationSnapshot ? (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Conversation History (
                          {selectedLead.conversationSnapshot.messages.length}{" "}
                          messages)
                        </h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {selectedLead.conversationSnapshot.messages.map(
                            (msg, idx) => (
                              <div
                                key={msg.localId || idx}
                                className={`p-3 rounded-lg ${
                                  msg.role === "USER"
                                    ? "bg-gray-100 ml-8"
                                    : "bg-blue-50 mr-8"
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2 mb-1">
                                  <span className="text-xs font-medium text-gray-600">
                                    {msg.role === "USER" ? "User" : "Assistant"}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatMessageTime(msg.createdAt)}
                                  </span>
                                </div>
                                {msg.role === "ASSISTANT" ? (
                                  <div className="chat-markdown assistant-message text-sm">
                                    <MarkdownContent content={msg.content} />
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                    {msg.content}
                                  </p>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ) : selectedLead.conversation ? (
                      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700">
                          Internal Chat Conversation
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          This lead was captured from the internal chat tab.
                          Message history is available in the database but not
                          displayed here yet.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No conversation data available
                      </p>
                    )}
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

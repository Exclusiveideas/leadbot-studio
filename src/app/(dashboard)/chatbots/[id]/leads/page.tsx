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
import EmptyState from "@/components/dashboard/EmptyState";
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
        return "bg-red-50 text-red-700";
      case "high":
        return "bg-orange-50 text-orange-700";
      case "medium":
        return "bg-yellow-50 text-yellow-700";
      case "low":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTextRequestStatusColor = (status: TextRequest["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 text-yellow-700";
      case "SEEN":
        return "bg-blue-50 text-blue-700";
      case "RESPONDED":
        return "bg-green-50 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-brand-muted">
            {total} lead{total !== 1 ? "s" : ""}, {contactsTotal} contact
            {contactsTotal !== 1 ? "s" : ""}, {textRequestsTotal} text request
            {textRequestsTotal !== 1 ? "s" : ""} captured
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="btn-secondary inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
          <h2 className="text-lg font-semibold text-brand-primary">
            Leads ({total})
          </h2>
          {leads.length > 0 && (
            <button
              onClick={() => exportToCSV(leads, "chatbot-leads")}
              className="btn-secondary inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <Download className="h-3 w-3 mr-1.5" />
              Export
            </button>
          )}
        </div>
        {leads.length === 0 ? (
          <EmptyState
            icon={User}
            title="No leads"
            description="Leads will appear here when visitors provide their contact information."
          />
        ) : (
          <div className="bg-white rounded-xl elevation-1 overflow-hidden border border-brand-border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border">
                <thead className="bg-brand-surface">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Case Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Captured
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-brand-border">
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-brand-surface transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {lead.name && (
                            <div className="flex items-center gap-2 text-sm font-medium text-brand-primary">
                              <User className="h-4 w-4 text-brand-muted" />
                              {lead.name}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-brand-muted">
                            <Mail className="h-4 w-4 text-brand-light" />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-sm text-brand-muted">
                              <Phone className="h-4 w-4 text-brand-light" />
                              {lead.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {lead.caseType && (
                            <div className="text-sm text-brand-primary">
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
                            <div className="text-sm text-brand-muted">
                              <span className="font-medium">Budget:</span>{" "}
                              {lead.budget}
                            </div>
                          )}
                          {lead.notes && (
                            <div className="text-sm text-brand-muted mt-2">
                              <span className="font-medium">Notes:</span>{" "}
                              {lead.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-brand-muted">
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
          <h2 className="text-lg font-semibold text-brand-primary">
            Contacts ({contactsTotal})
          </h2>
          {contacts.length > 0 && (
            <button
              onClick={() => exportToCSV(contacts, "chatbot-contacts")}
              className="btn-secondary inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <Download className="h-3 w-3 mr-1.5" />
              Export
            </button>
          )}
        </div>
        <p className="text-sm text-brand-muted">
          Contacts captured from booking requests when no Calendly link is
          configured.
        </p>
        {contacts.length === 0 ? (
          <EmptyState
            icon={Phone}
            title="No contacts"
            description="Contacts will appear here when visitors request to book a call."
          />
        ) : (
          <div className="bg-white rounded-xl elevation-1 overflow-hidden border border-brand-border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border">
                <thead className="bg-brand-surface">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Captured
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-brand-border">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => setSelectedLead(contact)}
                      className="hover:bg-brand-surface transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {contact.name && (
                            <div className="flex items-center gap-2 text-sm font-medium text-brand-primary">
                              <User className="h-4 w-4 text-brand-muted" />
                              {contact.name}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-brand-muted">
                            <Mail className="h-4 w-4 text-brand-light" />
                            {contact.email}
                          </div>
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm text-brand-muted">
                              <Phone className="h-4 w-4 text-brand-light" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-brand-muted">
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
          <h2 className="text-lg font-semibold text-brand-primary">
            Text Requests ({textRequestsTotal})
          </h2>
          {textRequests.length > 0 && (
            <button
              onClick={exportTextRequestsToCSV}
              className="btn-secondary inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <Download className="h-3 w-3 mr-1.5" />
              Export
            </button>
          )}
        </div>
        <p className="text-sm text-brand-muted">
          Messages from visitors who used the &quot;Send us a Text&quot;
          feature.
        </p>
        {textRequests.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No text requests"
            description='Text requests will appear here when visitors use the "Send us a Text" feature.'
          />
        ) : (
          <div className="bg-white rounded-xl elevation-1 overflow-hidden border border-brand-border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border">
                <thead className="bg-brand-surface">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-brand-border">
                  {textRequests.map((textRequest) => (
                    <tr
                      key={textRequest.id}
                      onClick={() => {
                        setSelectedTextRequest(textRequest);
                        if (textRequest.status === "PENDING") {
                          updateTextRequestStatus(textRequest.id, "SEEN");
                        }
                      }}
                      className="hover:bg-brand-surface transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-brand-primary">
                            <User className="h-4 w-4 text-brand-muted" />
                            {textRequest.firstName} {textRequest.lastName}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-brand-muted">
                            <Phone className="h-4 w-4 text-brand-light" />
                            {textRequest.phone}
                          </div>
                          {textRequest.email && (
                            <div className="flex items-center gap-2 text-sm text-brand-muted">
                              <Mail className="h-4 w-4 text-brand-light" />
                              {textRequest.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-brand-primary max-w-xs truncate">
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
                        <div className="flex items-center gap-2 text-sm text-brand-muted">
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
                  <h3 className="text-sm font-semibold text-brand-primary mb-3">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-brand-light" />
                      <div>
                        <p className="text-xs text-brand-muted">Phone</p>
                        <p className="text-sm font-medium text-brand-primary">
                          {selectedTextRequest.phone}
                        </p>
                      </div>
                    </div>
                    {selectedTextRequest.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-brand-light" />
                        <div>
                          <p className="text-xs text-brand-muted">Email</p>
                          <p className="text-sm font-medium text-brand-primary">
                            {selectedTextRequest.email}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="pt-4 border-t border-brand-border">
                  <h3 className="text-sm font-semibold text-brand-primary mb-3">
                    Message
                  </h3>
                  <p className="text-sm text-brand-primary whitespace-pre-wrap bg-brand-surface p-4 rounded-xl">
                    {selectedTextRequest.message}
                  </p>
                </div>

                {/* Status */}
                <div className="pt-4 border-t border-brand-border">
                  <h3 className="text-sm font-semibold text-brand-primary mb-3">
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
                        className="text-xs text-brand-blue hover:text-brand-blue/80 font-medium"
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
              <div className="border-b border-brand-border">
                <nav className="flex gap-4">
                  {(
                    [
                      { id: "overview", label: "Overview" },
                      { id: "case", label: "Case Details" },
                      { id: "conversation", label: "Conversation" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? "border-transparent text-brand-primary tab-active-border"
                          : "border-transparent text-brand-muted hover:text-brand-primary hover:border-brand-border"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="overflow-y-auto max-h-[calc(80vh-180px)] py-4">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-brand-primary mb-3">
                        Contact Information
                      </h3>
                      <div className="space-y-3">
                        {selectedLead.name && (
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-brand-light" />
                            <div>
                              <p className="text-xs text-brand-muted">Name</p>
                              <p className="text-sm font-medium text-brand-primary">
                                {selectedLead.name}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-brand-light" />
                          <div>
                            <p className="text-xs text-brand-muted">Email</p>
                            <p className="text-sm font-medium text-brand-primary">
                              {selectedLead.email}
                            </p>
                          </div>
                        </div>
                        {selectedLead.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-brand-light" />
                            <div>
                              <p className="text-xs text-brand-muted">Phone</p>
                              <p className="text-sm font-medium text-brand-primary">
                                {selectedLead.phone}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-brand-border">
                      <h3 className="text-sm font-semibold text-brand-primary mb-3">
                        Quick Info
                      </h3>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-brand-light" />
                        <div>
                          <p className="text-xs text-brand-muted">Captured</p>
                          <p className="text-sm font-medium text-brand-primary">
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
                        <label className="text-xs text-brand-muted">
                          Case Type
                        </label>
                        <p className="text-sm font-medium text-brand-primary mt-1">
                          {selectedLead.caseType}
                        </p>
                      </div>
                    )}
                    {selectedLead.urgency && (
                      <div>
                        <label className="text-xs text-brand-muted">
                          Urgency
                        </label>
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
                        <label className="text-xs text-brand-muted">
                          Budget
                        </label>
                        <p className="text-sm font-medium text-brand-primary mt-1">
                          {selectedLead.budget}
                        </p>
                      </div>
                    )}
                    {selectedLead.notes && (
                      <div>
                        <label className="text-xs text-brand-muted">
                          Notes
                        </label>
                        <p className="text-sm text-brand-primary mt-1 whitespace-pre-wrap leading-relaxed">
                          {selectedLead.notes}
                        </p>
                      </div>
                    )}
                    {!selectedLead.caseType &&
                      !selectedLead.urgency &&
                      !selectedLead.budget &&
                      !selectedLead.notes && (
                        <p className="text-sm text-brand-muted text-center py-8">
                          No case details available
                        </p>
                      )}
                  </div>
                )}

                {/* Conversation Tab */}
                {activeTab === "conversation" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-brand-surface rounded-xl p-4">
                        <p className="text-xs text-brand-muted mb-1">
                          Total Messages
                        </p>
                        <p className="text-2xl font-semibold text-brand-primary">
                          {selectedLead.conversationSnapshot?.messages.length ??
                            selectedLead.conversation?._count?.messages ??
                            0}
                        </p>
                      </div>
                      <div className="bg-brand-surface rounded-xl p-4">
                        <p className="text-xs text-brand-muted mb-1">
                          Captured
                        </p>
                        <p className="text-sm font-medium text-brand-primary">
                          {formatDate(selectedLead.capturedAt)}
                        </p>
                      </div>
                    </div>

                    {selectedLead.conversationSnapshot ? (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-brand-primary">
                          Conversation History (
                          {selectedLead.conversationSnapshot.messages.length}{" "}
                          messages)
                        </h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {selectedLead.conversationSnapshot.messages.map(
                            (msg, idx) => (
                              <div
                                key={msg.localId || idx}
                                className={`p-3 rounded-xl ${
                                  msg.role === "USER"
                                    ? "bg-brand-surface ml-8"
                                    : "bg-brand-blue/5 mr-8"
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2 mb-1">
                                  <span className="text-xs font-medium text-brand-muted">
                                    {msg.role === "USER" ? "User" : "Assistant"}
                                  </span>
                                  <span className="text-xs text-brand-light">
                                    {formatMessageTime(msg.createdAt)}
                                  </span>
                                </div>
                                {msg.role === "ASSISTANT" ? (
                                  <div className="chat-markdown assistant-message text-sm">
                                    <MarkdownContent content={msg.content} />
                                  </div>
                                ) : (
                                  <p className="text-sm text-brand-primary whitespace-pre-wrap">
                                    {msg.content}
                                  </p>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ) : selectedLead.conversation ? (
                      <div className="border border-dashed border-brand-border rounded-xl p-8 text-center">
                        <MessageSquare className="h-10 w-10 text-brand-light mx-auto mb-3" />
                        <p className="text-sm font-medium text-brand-secondary">
                          Internal Chat Conversation
                        </p>
                        <p className="text-xs text-brand-muted mt-1">
                          This lead was captured from the internal chat tab.
                          Message history is available in the database but not
                          displayed here yet.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-brand-muted text-center py-8">
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

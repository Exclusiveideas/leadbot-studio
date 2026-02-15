"use client";

import type { User } from "@/types/session";
import {
  Crown,
  Loader2,
  Mail,
  MoreVertical,
  RotateCw,
  Send,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

type Member = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  organizationRole: "OWNER" | "MEMBER";
  lastLoginAt: string | null;
  createdAt: string;
};

type Invite = {
  id: string;
  email: string;
  role: "OWNER" | "MEMBER";
  status: string;
  expiresAt: string;
  createdAt: string;
  inviter: { name: string | null; email: string };
};

export default function TeamTab({ user }: { user: User }) {
  const { addToast } = useToast();
  const isOwner = user.organizationRole === "OWNER";

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"OWNER" | "MEMBER">("MEMBER");
  const [sendingInvite, setSendingInvite] = useState(false);

  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/organizations/members");
      const data = await res.json();
      if (data.success) setMembers(data.data);
    } catch {
      addToast("Failed to load team members", "error");
    } finally {
      setLoadingMembers(false);
    }
  }, [addToast]);

  const fetchInvites = useCallback(async () => {
    if (!isOwner) {
      setLoadingInvites(false);
      return;
    }
    try {
      const res = await fetch("/api/organizations/invites");
      const data = await res.json();
      if (data.success) setInvites(data.data);
    } catch {
      addToast("Failed to load invites", "error");
    } finally {
      setLoadingInvites(false);
    }
  }, [isOwner, addToast]);

  useEffect(() => {
    fetchMembers();
    fetchInvites();
  }, [fetchMembers, fetchInvites]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenuId(null);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setActionMenuId(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSendingInvite(true);
    try {
      const res = await fetch("/api/organizations/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to send invite", "error");
        return;
      }
      addToast(`Invite sent to ${inviteEmail}`, "success");
      setInviteEmail("");
      setInviteRole("MEMBER");
      fetchInvites();
    } catch {
      addToast("Failed to send invite", "error");
    } finally {
      setSendingInvite(false);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    setActionLoadingId(inviteId);
    try {
      const res = await fetch(`/api/organizations/invites/${inviteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        addToast(data.error || "Failed to revoke invite", "error");
        return;
      }
      addToast("Invite revoked", "success");
      fetchInvites();
    } catch {
      addToast("Failed to revoke invite", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleResendInvite(inviteId: string) {
    setActionLoadingId(inviteId);
    try {
      const res = await fetch(`/api/organizations/invites/${inviteId}/resend`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        addToast(data.error || "Failed to resend invite", "error");
        return;
      }
      addToast("Invite resent", "success");
    } catch {
      addToast("Failed to resend invite", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleToggleRole(member: Member) {
    const newRole = member.organizationRole === "OWNER" ? "MEMBER" : "OWNER";
    try {
      const res = await fetch(`/api/organizations/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to update role", "error");
        return;
      }
      addToast(
        `${member.name || member.email} is now ${newRole === "OWNER" ? "an Owner" : "a Member"}`,
        "success",
      );
      fetchMembers();
    } catch {
      addToast("Failed to update role", "error");
    }
    setActionMenuId(null);
  }

  async function handleRemoveMember(member: Member) {
    if (
      !confirm(
        `Remove ${member.name || member.email} from the team? They will be moved to their own workspace.`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/organizations/members/${member.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to remove member", "error");
        return;
      }
      addToast(`${member.name || member.email} has been removed`, "success");
      fetchMembers();
    } catch {
      addToast("Failed to remove member", "error");
    }
    setActionMenuId(null);
  }

  function getInitials(name: string | null, email: string) {
    if (name) {
      return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const isLoading = loadingMembers || loadingInvites;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Invite Form — owners only */}
      {isOwner && (
        <div>
          <h3 className="text-sm font-semibold text-brand-primary uppercase tracking-wide mb-3">
            Invite a team member
          </h3>
          <form onSubmit={handleSendInvite} className="flex gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="w-full pl-10 pr-3 py-2.5 border border-brand-border rounded-lg text-sm text-brand-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as "OWNER" | "MEMBER")
              }
              className="border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="MEMBER">Member</option>
              <option value="OWNER">Owner</option>
            </select>
            <button
              type="submit"
              disabled={sendingInvite || !inviteEmail.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingInvite ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Invite
            </button>
          </form>
        </div>
      )}

      {/* Members List */}
      <div>
        <h3 className="text-sm font-semibold text-brand-primary uppercase tracking-wide mb-3">
          Team members ({members.length})
        </h3>
        <div className="border border-brand-border rounded-lg divide-y divide-gray-100">
          {members.map((member) => {
            const isSelf = member.id === user.id;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-brand-surface/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-brand-muted">
                      {getInitials(member.name, member.email)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-brand-primary truncate">
                        {member.name || member.email}
                      </span>
                      {isSelf && (
                        <span className="text-xs text-gray-400">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-brand-muted truncate">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                      member.organizationRole === "OWNER"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-gray-100 text-brand-muted"
                    }`}
                  >
                    {member.organizationRole === "OWNER" && (
                      <Crown className="h-3 w-3" />
                    )}
                    {member.organizationRole === "OWNER" ? "Owner" : "Member"}
                  </span>

                  <span className="text-xs text-gray-400 hidden sm:block">
                    Joined {formatDate(member.createdAt)}
                  </span>

                  {isOwner && !isSelf && (
                    <div
                      className="relative"
                      ref={actionMenuId === member.id ? menuRef : undefined}
                    >
                      <button
                        onClick={() =>
                          setActionMenuId(
                            actionMenuId === member.id ? null : member.id,
                          )
                        }
                        aria-label={`Actions for ${member.name || member.email}`}
                        aria-expanded={actionMenuId === member.id}
                        aria-haspopup="menu"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-muted hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {actionMenuId === member.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-brand-border rounded-lg shadow-lg py-1 z-10">
                          <button
                            onClick={() => handleToggleRole(member)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-muted hover:bg-brand-surface transition-colors"
                          >
                            <Crown className="h-4 w-4" />
                            {member.organizationRole === "OWNER"
                              ? "Demote to Member"
                              : "Promote to Owner"}
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <UserMinus className="h-4 w-4" />
                            Remove from team
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invites — owners only */}
      {isOwner && invites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-brand-primary uppercase tracking-wide mb-3">
            Pending invites ({invites.length})
          </h3>
          <div className="border border-brand-border rounded-lg divide-y divide-gray-100">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-brand-surface border border-dashed border-gray-300 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-brand-primary truncate">
                      {invite.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      Invited {formatDate(invite.createdAt)} &middot; Expires{" "}
                      {formatDate(invite.expiresAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-brand-muted bg-gray-100 px-2 py-1 rounded-full">
                    {invite.role === "OWNER" ? "Owner" : "Member"}
                  </span>
                  <button
                    onClick={() => handleResendInvite(invite.id)}
                    disabled={actionLoadingId === invite.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-muted hover:bg-gray-100 transition-colors disabled:opacity-50"
                    title="Resend invite"
                    aria-label={`Resend invite to ${invite.email}`}
                  >
                    {actionLoadingId === invite.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    disabled={actionLoadingId === invite.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Revoke invite"
                    aria-label={`Revoke invite for ${invite.email}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

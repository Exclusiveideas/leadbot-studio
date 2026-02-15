"use client";

import type { User } from "@/types/session";
import { Building, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

export default function WorkspaceTab({ user }: { user: User }) {
  const { addToast } = useToast();
  const isOwner = user.organizationRole === "OWNER";

  const [orgName, setOrgName] = useState(user.organization.name);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orgName.trim();
    if (!trimmed || trimmed === user.organization.name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/organizations/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to update workspace", "error");
        return;
      }
      addToast("Workspace name updated", "success");
    } catch {
      addToast("Failed to update workspace", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-brand-primary uppercase tracking-wide mb-4">
          Workspace settings
        </h3>
        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <div>
            <label
              htmlFor="org-name"
              className="block text-sm font-medium text-brand-primary mb-2"
            >
              Workspace name
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-light" />
              <input
                id="org-name"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={!isOwner}
                className="w-full pl-10 pr-3 py-2.5 border border-brand-border rounded-lg text-sm text-brand-primary placeholder:text-brand-light focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue disabled:bg-brand-surface disabled:text-brand-muted"
                placeholder="My Workspace"
              />
            </div>
            {!isOwner && (
              <p className="mt-1.5 text-xs text-brand-muted">
                Only workspace owners can change the name.
              </p>
            )}
          </div>
          {isOwner && (
            <button
              type="submit"
              disabled={
                saving ||
                !orgName.trim() ||
                orgName.trim() === user.organization.name
              }
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </button>
          )}
        </form>
      </div>

      <div className="border-t border-brand-border pt-6">
        <h3 className="text-sm font-semibold text-brand-primary uppercase tracking-wide mb-2">
          Workspace info
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-brand-muted">Workspace ID</dt>
            <dd className="mt-0.5 font-mono text-brand-muted text-xs">
              {user.organization.id}
            </dd>
          </div>
          {user.organization.createdAt && (
            <div>
              <dt className="text-brand-muted">Created</dt>
              <dd className="mt-0.5 text-brand-muted">
                {new Date(user.organization.createdAt).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" },
                )}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

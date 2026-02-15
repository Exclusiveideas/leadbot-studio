"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

type AcceptState = "loading" | "success" | "error" | "no-token";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<AcceptState>(
    token ? "loading" : "no-token",
  );
  const [orgName, setOrgName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const acceptInvite = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (res.status === 401) {
        document.cookie = `invite_token=${token}; path=/; max-age=3600; SameSite=Strict; Secure`;
        router.push(
          `/login?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`,
        );
        return;
      }

      if (!res.ok) {
        setErrorMessage(data.error || "Something went wrong");
        setState("error");
        return;
      }

      setOrgName(data.data.organizationName);
      setState("success");
    } catch {
      setErrorMessage("Failed to accept invite. Please try again.");
      setState("error");
    }
  }, [token, router]);

  useEffect(() => {
    if (token) acceptInvite();
  }, [token, acceptInvite]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        {state === "loading" && (
          <div className="space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-gray-400 mx-auto" />
            <p className="text-gray-600">Accepting your invite...</p>
          </div>
        )}

        {state === "success" && (
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Welcome to {orgName}!
            </h1>
            <p className="text-gray-500 text-sm">
              You&apos;ve successfully joined the team. You can now access
              shared chatbots and collaborate with your teammates.
            </p>
            <Link
              href="/chatbots"
              className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Invite could not be accepted
            </h1>
            <p className="text-gray-500 text-sm">{errorMessage}</p>
            <Link
              href="/chatbots"
              className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {state === "no-token" && (
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Missing invite link
            </h1>
            <p className="text-gray-500 text-sm">
              This page requires a valid invite link. If you received an
              invitation email, please use the link from that email.
            </p>
            <Link
              href="/chatbots"
              className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}

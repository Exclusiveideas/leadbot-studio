"use client";

import { useState, useEffect } from "react";
import { Link2, Loader2, CheckCircle2 } from "lucide-react";
import { signIn } from "next-auth/react";

interface GoogleAccountLinkProps {
  onUpdate: () => void;
}

interface LinkStatus {
  hasPassword: boolean;
  hasGoogleLinked: boolean;
  authProvider: string;
  canLinkGoogle: boolean;
}

export default function GoogleAccountLink({
  onUpdate,
}: GoogleAccountLinkProps) {
  const [linkStatus, setLinkStatus] = useState<LinkStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLinkStatus();
  }, []);

  const fetchLinkStatus = async () => {
    try {
      const response = await fetch("/api/auth/account/link", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch link status");
      }

      const data = await response.json();
      setLinkStatus(data);
    } catch (err) {
      setError("Failed to load account linking status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinking(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/account/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          password,
          ...(mfaRequired && { mfaToken }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.mfaRequired) {
          setMfaRequired(true);
          setIsLinking(false);
          return;
        }
        setError(data.error || "Failed to initiate account linking");
        setIsLinking(false);
        return;
      }

      if (data.success) {
        // Use next-auth signIn to trigger OAuth flow
        // Note: No toast here since page will redirect immediately
        await signIn("google", {
          callbackUrl: "/settings",
          redirect: true,
        });
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLinking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center space-x-3 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!linkStatus) {
    return null;
  }

  // User signed up with Google (no password) - show info only
  if (!linkStatus.hasPassword) {
    return (
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              Google Account Connected
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your account uses Google Sign-In. You can log in using your Google
              account.
            </p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        </div>
      </div>
    );
  }

  // User has Google linked already
  if (linkStatus.hasGoogleLinked) {
    return (
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Link2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              Google Account Linked
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You can sign in with either your password or Google account.
            </p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        </div>
      </div>
    );
  }

  // User can link Google (has password, no Google linked yet)
  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <div className="flex items-start space-x-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-200/50 rounded-lg flex items-center justify-center">
          <Link2 className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            Link Google Account
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Link your Google account for faster sign-in. You'll still be able to
            use your password.
          </p>
        </div>
      </div>

      <form onSubmit={handleLinkGoogle} className="space-y-4 ml-13">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="link-password"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Confirm your password
          </label>
          <input
            id="link-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {mfaRequired && (
          <div>
            <label
              htmlFor="link-mfa"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              MFA Code
            </label>
            <input
              id="link-mfa"
              type="text"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value.slice(0, 9))}
              placeholder="123456 or XXXX-XXXX"
              required
              maxLength={9}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the code from your authenticator app or a backup code
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={
            isLinking || !password || (mfaRequired && mfaToken.length < 6)
          }
          className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-600/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLinking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Link Google Account
            </>
          )}
        </button>
      </form>
    </div>
  );
}

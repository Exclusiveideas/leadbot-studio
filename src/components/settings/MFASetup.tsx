"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Copy,
  Download,
  RefreshCw,
  ShieldOff,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/toast";
import type { User } from "@/types/session";

interface MFAData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface MFASetupProps {
  user: User;
  onUpdate: () => void;
}

const DISABLING_TOAST_DURATION_MS = 10000; // Keep toast visible during disable operation

export default function MFASetup({ user, onUpdate }: MFASetupProps) {
  const [mfaData, setMfaData] = useState<MFAData | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showRegenerateFlow, setShowRegenerateFlow] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState("");
  const [regeneratedCodes, setRegeneratedCodes] = useState<string[] | null>(
    null,
  );
  const { addToast } = useToast();

  const generateMFASecret = async () => {
    setIsGenerating(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/setup-mfa", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors({ general: data.error || "Failed to generate MFA secret" });
        return;
      }

      const data = await response.json();
      setMfaData(data);
      setShowSetup(true);
    } catch (error) {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      setErrors({ code: "Please enter a 6-digit code" });
      return;
    }

    if (!mfaData) {
      setErrors({ general: "MFA data not loaded. Please refresh the page." });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/setup-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: verificationCode,
          secret: mfaData.secret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || "Invalid verification code" });
        return;
      }

      setMfaData({ ...mfaData, backupCodes: data.backupCodes });
      setShowBackupCodes(true);
      onUpdate();
    } catch (error) {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);
    if (errors.code) {
      setErrors({});
    }
  };

  const copyBackupCodes = () => {
    if (mfaData?.backupCodes) {
      navigator.clipboard.writeText(mfaData.backupCodes.join("\n"));
    }
  };

  const downloadBackupCodes = () => {
    if (mfaData?.backupCodes) {
      const content = `LeadBotStudio - Backup Codes\n\nSave these codes in a secure location. Each code can only be used once.\n\n${mfaData.backupCodes.join("\n")}`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leadbotstudio-backup-codes.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const disableMFA = async () => {
    setShowDisableConfirm(false);
    setIsLoading(true);
    setErrors({});

    // Show loading toast
    addToast("Disabling MFA...", "info", DISABLING_TOAST_DURATION_MS);

    try {
      const response = await fetch("/api/auth/setup-mfa", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        addToast(data.error || "Failed to disable MFA", "error");
        setErrors({ general: data.error || "Failed to disable MFA" });
        return;
      }

      // Show success toast
      addToast("MFA disabled successfully", "success");

      // Refresh user data to reflect MFA disabled state
      onUpdate();
    } catch (error) {
      addToast("An error occurred. Please try again.", "error");
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const finishSetup = () => {
    setShowSetup(false);
    setShowBackupCodes(false);
    setMfaData(null);
    setVerificationCode("");
  };

  const handleRegenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regenerateCode || regenerateCode.length !== 6) {
      setErrors({ regenerate: "Please enter a 6-digit code" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/setup-mfa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: regenerateCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ regenerate: data.error || "Failed to regenerate codes" });
        return;
      }

      setRegeneratedCodes(data.backupCodes);
      addToast("Backup codes regenerated successfully", "success");
    } catch (error) {
      setErrors({ regenerate: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const finishRegenerate = () => {
    setShowRegenerateFlow(false);
    setRegeneratedCodes(null);
    setRegenerateCode("");
    setErrors({});
  };

  const copyRegeneratedCodes = () => {
    if (regeneratedCodes) {
      navigator.clipboard.writeText(regeneratedCodes.join("\n"));
      addToast("Backup codes copied to clipboard", "success");
    }
  };

  const downloadRegeneratedCodes = () => {
    if (regeneratedCodes) {
      const content = `LeadBotStudio - Backup Codes\n\nSave these codes in a secure location. Each code can only be used once.\n\n${regeneratedCodes.join("\n")}`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leadbotstudio-backup-codes.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // OAuth-only users (no password) - show info message
  if (!user.hasPassword) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-500">
              Add an extra layer of security to your account
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <ShieldCheck className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                MFA Not Available for Google Sign-In
              </h4>
              <p className="mt-1 text-sm text-blue-800">
                Two-factor authentication is not available for accounts using
                Google Sign-In. Your account is already secured through your
                Google account's authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regenerate backup codes flow
  if (showRegenerateFlow) {
    // Show regenerated codes
    if (regeneratedCodes) {
      return (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <ShieldCheck className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-sm font-medium text-green-800">
                Backup Codes Regenerated!
              </h3>
            </div>
            <p className="mt-1 text-sm text-green-700">
              Your old backup codes have been invalidated. Save these new codes.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Your New Backup Codes
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Store these codes in a secure location. Each code can only be used
              once.
            </p>

            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {regeneratedCodes.map((code, index) => (
                  <div
                    key={index}
                    className="font-mono text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200 text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={copyRegeneratedCodes}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Codes
                </button>
                <button
                  onClick={downloadRegeneratedCodes}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Codes
                </button>
              </div>
            </div>

            <button
              onClick={finishRegenerate}
              className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-600/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      );
    }

    // Show verification form
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Regenerate Backup Codes
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Enter your authenticator code to verify your identity and generate
            new backup codes. Your old codes will be invalidated.
          </p>

          {errors.regenerate && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.regenerate}
            </div>
          )}

          <form onSubmit={handleRegenerateSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Authenticator Code
              </label>
              <input
                type="text"
                value={regenerateCode}
                onChange={(e) =>
                  setRegenerateCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                className="w-full text-gray-900 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="000000"
                maxLength={6}
                autoComplete="off"
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading || regenerateCode.length !== 6}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-600/90 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Regenerating..." : "Regenerate Codes"}
              </button>
              <button
                type="button"
                onClick={finishRegenerate}
                className="px-4 py-2.5 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showBackupCodes && mfaData?.backupCodes) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <ShieldCheck className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-sm font-medium text-green-800">
              MFA Successfully Enabled!
            </h3>
          </div>
          <p className="mt-1 text-sm text-green-700">
            Your account is now protected with two-factor authentication.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Save Your Backup Codes
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Store these codes in a secure location. You can use them to access
            your account if you lose your authenticator device.
          </p>

          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {mfaData.backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="font-mono text-sm text-gray-900 bg-white p-2 rounded-lg border border-gray-200 text-center"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={copyBackupCodes}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Codes
              </button>
              <button
                onClick={downloadBackupCodes}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Codes
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Each backup code can only be used
              once. Once you've used all codes, you'll need to generate new
              ones.
            </p>
          </div>

          <button
            onClick={finishSetup}
            className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-600/90 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (showSetup && mfaData) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Set Up Two-Factor Authentication
          </h3>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Step 1: Scan QR Code
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Use your authenticator app (Google Authenticator, Authy, etc.)
                to scan this QR code:
              </p>

              <div className="flex justify-center mb-4">
                <img
                  src={mfaData.qrCode}
                  alt="MFA QR Code"
                  className="border border-gray-200 rounded-lg"
                />
              </div>

              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">
                  Can't scan? Enter this code manually:
                </p>
                <code className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded-lg border border-gray-200">
                  {mfaData.secret}
                </code>
              </div>
            </div>

            <form onSubmit={handleVerificationSubmit}>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Step 2: Enter Verification Code
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Enter the 6-digit code from your authenticator app:
              </p>

              <div className="mb-4">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={handleCodeChange}
                  className="w-full text-gray-900 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="off"
                  disabled={isLoading}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-600/90 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Verifying..." : "Verify and Enable MFA"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSetup(false)}
                  className="px-4 py-2.5 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showDisableConfirm}
        onClose={() => setShowDisableConfirm(false)}
        onConfirm={disableMFA}
        title="Disable Two-Factor Authentication"
        message="Are you sure you want to disable two-factor authentication? This will make your account less secure and you will only need your password to log in."
        confirmText="Disable MFA"
        cancelText="Cancel"
        variant="warning"
        icon={<ShieldOff className="w-6 h-6" />}
        isLoading={isLoading}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-500">
              Add an extra layer of security to your account
            </p>
          </div>
          <div className="flex items-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.mfaEnabled
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {user.mfaEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> MFA only applies when logging in with email
            and password. If you also use Google Sign-In, MFA will not be
            required for those logins.
          </p>
        </div>

        {user.mfaEnabled ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <ShieldCheck className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-green-800">
                  MFA is enabled
                </h4>
                <p className="text-sm text-green-700">
                  Your account is protected with two-factor authentication.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <button
                onClick={() => setShowRegenerateFlow(true)}
                disabled={isLoading}
                className="flex items-center text-sm text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate Backup Codes
              </button>
              <button
                onClick={() => setShowDisableConfirm(true)}
                disabled={isLoading}
                className="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Disable MFA
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <ShieldCheck className="h-5 w-5 text-amber-600 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">
                  MFA is not enabled
                </h4>
                <p className="text-sm text-amber-700">
                  Protect your account by enabling two-factor authentication.
                </p>
              </div>
            </div>
            <button
              onClick={generateMFASecret}
              disabled={isGenerating}
              className="flex items-center px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-600/90 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Enable MFA
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

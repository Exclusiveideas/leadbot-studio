"use client";

import Logo from "@/components/shared/Logo";
import { useToast } from "@/components/ui/toast";
import { ChevronLeft, Eye, EyeClosed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import "../auth-seira.css";

interface LoginFormData {
  email: string;
  password: string;
  mfaToken?: string;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [btnActive, setBtnActive] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!formData.email || !formData.password) {
      setBtnActive(false);
    } else {
      setBtnActive(true);
    }
  }, [formData]);

  const validateForm = (): boolean => {
    if (!formData.email) {
      addToast("Email is required", "error");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      addToast("Invalid email address", "error");
      return false;
    }

    if (!formData.password) {
      addToast("Password is required", "error");
      return false;
    }

    if (mfaRequired && !formData.mfaToken) {
      addToast("MFA code is required", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!btnActive && !mfaRequired) return;
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.mfaSetupRequired && data.mfaSetupToken) {
          // Organization requires MFA - redirect to setup with token
          addToast(
            "Your organization requires multi-factor authentication. Redirecting to setup...",
            "info",
          );
          router.push(`/setup-mfa?setup_token=${data.mfaSetupToken}`);
          return;
        } else if (data.needsVerification) {
          setNeedsVerification(true);
          setVerificationEmail(data.email);
          addToast(data.error, "error");
        } else if (response.status === 423) {
          // Account locked - show duration
          const minutes = data.retryAfterSeconds
            ? Math.ceil(data.retryAfterSeconds / 60)
            : 20;
          addToast(
            `Account locked due to too many failed attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
            "error",
            10000,
          );
        } else if (data.warning) {
          // Show warning about remaining attempts along with the error
          addToast(data.error, "error");
          addToast(data.warning, "warning", 8000);
        } else if (data.error) {
          addToast(data.error, "error");
        }
        return;
      }

      if (data.mfaRequired) {
        setMfaRequired(true);
        addToast("Please enter your 2FA code", "info");
        return;
      }

      // Login successful
      addToast("Login successful!", "success");
      router.push(redirectUrl);
    } catch (error) {
      addToast("An error occurred. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail || isResendingVerification) return;

    setIsResendingVerification(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.retryAfter) {
          addToast(`${data.error}`, "error");
        } else {
          addToast(
            data.error || "Failed to resend verification email",
            "error",
          );
        }
        return;
      }

      addToast("Verification email sent! Please check your inbox.", "success");
      setNeedsVerification(false);
    } catch (error) {
      addToast("An error occurred. Please try again.", "error");
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="login-authBGWrapper">
        <Image
          src="/images/background-auth.webp"
          alt="auth Image"
          width={1920}
          height={1080}
          className="auth-bg-image"
          priority
        />
        <div className="auth-bg-overlay" />
      </div>
      <Link href="/" className="auth-back-btn">
        <ChevronLeft size={16} /> <span>Home</span>
      </Link>

      <div className="auth-form-wrapper">
        <Logo size="big" />
        <div className="auth-header">
          <h1 className="auth-title">Log in to your account</h1>
          <p className="auth-subtitle">
            {mfaRequired
              ? "Enter your authentication code to continue"
              : "Don't have an account?"}
            {!mfaRequired && (
              <>
                {" "}
                <Link
                  href={`/signup${redirectUrl !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                  className="auth-link"
                >
                  Sign up
                </Link>
              </>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!mfaRequired && (
            <>
              <div className="auth-form-field">
                <label htmlFor="email" className="auth-form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>

              <div className="auth-form-field">
                <div className="auth-form-label-row">
                  <label htmlFor="password" className="auth-form-label">
                    Password
                  </label>
                  <Link href="/reset-password" className="auth-link">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="•••••••••••••"
                  disabled={isLoading}
                />
                <div
                  className="auth-eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                </div>
              </div>
            </>
          )}

          {mfaRequired && (
            <div className="auth-form-field">
              <label htmlFor="mfaToken" className="auth-form-label">
                Two-Factor Authentication Code
              </label>
              <input
                type="text"
                id="mfaToken"
                name="mfaToken"
                value={formData.mfaToken || ""}
                onChange={handleChange}
                className="auth-input"
                placeholder="123456 or XXXX-XXXX"
                maxLength={9}
                disabled={isLoading}
                autoFocus
              />
              <p className="auth-helper-text">
                Enter the 6-digit code from your authenticator app or a backup
                code (XXXX-XXXX)
              </p>
            </div>
          )}

          <button
            type="submit"
            className="auth-btn"
            disabled={isLoading || (!btnActive && !mfaRequired)}
          >
            {isLoading ? (
              <div className="auth-loading">
                <div className="auth-spinner" />
                <span>Signing in...</span>
              </div>
            ) : (
              <span>{mfaRequired ? "Verify" : "Log in"}</span>
            )}
          </button>
        </form>

        {needsVerification && (
          <div className="auth-notice">
            <h3 className="auth-notice-title">Email Verification Required</h3>
            <p className="auth-notice-text">
              Your email address needs to be verified before you can log in.
              Didn't receive the email? Check your spam folder or request a new
              one.
            </p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isResendingVerification}
              className="auth-btn auth-btn-secondary"
            >
              {isResendingVerification ? (
                <div className="auth-loading">
                  <div className="auth-spinner" />
                  <span>Sending...</span>
                </div>
              ) : (
                <span>Resend verification email</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthLoadingFallback() {
  return (
    <div className="auth-page">
      <div className="login-authBGWrapper">
        <Image
          src="/images/background-auth.webp"
          alt="auth Image"
          width={1920}
          height={1080}
          className="auth-bg-image"
          priority
        />
        <div className="auth-bg-overlay" />
      </div>
      <div className="auth-form-wrapper">
        <Logo size="big" />
        <div className="auth-loading-container">
          <div className="auth-loading-spinner-large" />
          <p className="auth-loading-text">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}

"use client";

import Logo from "@/components/shared/Logo";
import { ChevronLeft, Eye, EyeClosed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import "../auth-seira.css";
import "@/components/ui/auth-pointer-events.css";

interface ResetFormData {
  email: string;
  password: string;
  confirmPassword: string;
  token: string;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"request" | "reset">("request");
  const [formData, setFormData] = useState<ResetFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    token: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [btnActive, setBtnActive] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setMode("reset");
      setFormData((prev) => ({ ...prev, token }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  useEffect(() => {
    if (mode === "request") {
      setBtnActive(!!formData.email && /\S+@\S+\.\S+/.test(formData.email));
    } else {
      setBtnActive(!!formData.password && !!formData.confirmPassword);
    }
  }, [formData, mode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === "request") {
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Invalid email address";
      }
    } else {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter";
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one lowercase letter";
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = "Password must contain at least one number";
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one special character";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!btnActive) return;
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const body =
        mode === "request"
          ? { email: formData.email }
          : {
              token: formData.token,
              password: formData.password,
              confirmPassword: formData.confirmPassword,
            };

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error) {
          setErrors({ general: data.error });
        }
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          data.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              fieldErrors[detail.path[0]] = detail.message;
            }
          });
          setErrors(fieldErrors);
        }
        return;
      }

      if (mode === "request") {
        setRequestSuccess(true);
        // Development mode - token logging removed for production security
      } else {
        setResetSuccess(true);
      }
    } catch (error) {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (requestSuccess) {
    return (
      <div className="auth-page">
        <div className="authBGWrapper">
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
          <div className="auth-success-icon">✓</div>
          <div className="auth-header">
            <h1 className="auth-title">Reset Email Sent!</h1>
            <p className="auth-subtitle">
              If an account exists with <strong>{formData.email}</strong>, you
              will receive a password reset link shortly.
            </p>
          </div>

          <Link href="/login" className="auth-btn auth-btn-spaced">
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="auth-page">
        <div className="authBGWrapper">
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
          <div className="auth-success-icon">✓</div>
          <div className="auth-header">
            <h1 className="auth-title">Password Reset Successfully!</h1>
            <p className="auth-subtitle">
              Your password has been reset. You can now log in with your new
              password.
            </p>
          </div>

          <Link href="/login" className="auth-btn auth-btn-spaced">
            <span>Go to Login</span>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="auth-page">
      <div className="authBGWrapper">
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
          <h1 className="auth-title">
            {mode === "request" ? "Reset Password" : "Set New Password"}
          </h1>
          <p className="auth-subtitle">
            {mode === "request"
              ? "Include the email address associated with your account and we'll send you an email with instructions to reset your password."
              : "Enter your new password below"}
            {mode === "request" && (
              <>
                {" "}
                <Link href="/login" className="auth-link">
                  Back to Login
                </Link>
              </>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.general && (
            <div className="auth-error-msg">{errors.general}</div>
          )}

          {mode === "request" ? (
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
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && (
                <span className="auth-field-error">{errors.email}</span>
              )}
            </div>
          ) : (
            <>
              <div className="auth-form-field">
                <label htmlFor="password" className="auth-form-label">
                  New Password
                </label>
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
                {errors.password && (
                  <span className="auth-field-error">{errors.password}</span>
                )}
                <p className="auth-helper-text">
                  Password must be at least 8 characters with uppercase,
                  lowercase, number, and special character
                </p>
              </div>

              <div className="auth-form-field">
                <label htmlFor="confirmPassword" className="auth-form-label">
                  Confirm New Password
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="•••••••••••••"
                  disabled={isLoading}
                />
                <div
                  className="auth-eye-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeClosed size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </div>
                {errors.confirmPassword && (
                  <span className="auth-field-error">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            className="auth-btn"
            disabled={isLoading || !btnActive}
          >
            {isLoading ? (
              <div className="auth-loading">
                <div className="auth-spinner" />
                <span>
                  {mode === "request" ? "Sending..." : "Resetting..."}
                </span>
              </div>
            ) : (
              <span>
                {mode === "request" ? "Send reset email" : "Reset Password"}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Loading component
function ResetPasswordLoading() {
  return (
    <div className="authPage">
      <div className="authBGWrapper">
        <div className="w-full h-screen bg-gray-900 animate-pulse" />
      </div>
      <div className="form_wrapper w-full max-w-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-white">Loading...</span>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

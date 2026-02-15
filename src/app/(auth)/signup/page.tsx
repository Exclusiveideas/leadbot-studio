"use client";

import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import Logo from "@/components/shared/Logo";
import { useToast } from "@/components/ui/toast";
import { ChevronLeft, Eye, EyeClosed } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import "../auth-seira.css";

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  agreedToTerms: boolean;
}

function SignupContent() {
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/chatbots";

  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    agreedToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [btnActive, setBtnActive] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  useEffect(() => {
    if (
      !formData.name ||
      !formData.email ||
      !/\S+@\S+\.\S+/.test(formData.email) ||
      !formData.password ||
      !formData.agreedToTerms
    ) {
      setBtnActive(false);
    } else {
      setBtnActive(true);
    }
  }, [formData]);

  const validateForm = (): boolean => {
    if (!formData.name) {
      addToast("Name is required", "error");
      return false;
    } else if (formData.name.length > 100) {
      addToast("Name must be less than 100 characters", "error");
      return false;
    }

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
    } else if (formData.password.length < 8) {
      addToast("Password must be at least 8 characters", "error");
      return false;
    } else if (!/[A-Z]/.test(formData.password)) {
      addToast("Password must contain at least one uppercase letter", "error");
      return false;
    } else if (!/[a-z]/.test(formData.password)) {
      addToast("Password must contain at least one lowercase letter", "error");
      return false;
    } else if (!/[0-9]/.test(formData.password)) {
      addToast("Password must contain at least one number", "error");
      return false;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      addToast("Password must contain at least one special character", "error");
      return false;
    }

    if (!formData.agreedToTerms) {
      addToast("You must agree to the terms and conditions", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!btnActive) return;
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error) {
          addToast(data.error, "error");
        }
        if (data.details) {
          data.details.forEach((detail: any) => {
            if (detail.message) {
              addToast(detail.message, "error");
            }
          });
        }
        return;
      }

      addToast("Account created successfully!", "success");
      setSignupSuccess(true);

      if (data.verificationToken && process.env.NODE_ENV === "development") {
        setVerificationToken(data.verificationToken);
        const verifyUrl = `/verify-email?token=${data.verificationToken}`;
        addToast(
          `Development: Verification link - ${window.location.origin}${verifyUrl}`,
          "info",
          10000,
        );
      }
    } catch (error) {
      addToast("An error occurred. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="auth-page">
        <AuthBrandPanel
          headline="You're one step away from capturing more leads"
          subtext="Join thousands of service professionals already growing their business with AI chatbots."
          testimonial={{
            quote:
              "Setting up took less than 5 minutes. Within the first day, our chatbot booked 3 consultations while I was in court.",
            name: "James Rodriguez",
            role: "Immigration Attorney",
            initials: "JR",
          }}
        />

        <div className="auth-form-panel">
          <div className="auth-bg-mesh" />
          <Link href="/" className="auth-back-btn">
            <ChevronLeft size={16} /> <span>Home</span>
          </Link>

          <div className="auth-form-wrapper">
            <Logo size="big" />
            <div className="auth-success-icon">&#10003;</div>
            <div className="auth-header">
              <h1 className="auth-title">Account Created!</h1>
              <p className="auth-subtitle">
                We&apos;ve sent a verification email to{" "}
                <strong>{formData.email}</strong>. Please check your inbox and
                click the verification link to activate your account.
              </p>
            </div>

            {verificationToken && process.env.NODE_ENV === "development" && (
              <div className="auth-dev-box">
                <p className="auth-dev-label">
                  Development Mode - Click to verify:
                </p>
                <Link
                  href={`/verify-email?token=${verificationToken}`}
                  className="auth-dev-link"
                >
                  Verify Email
                </Link>
              </div>
            )}

            <Link
              href={`/login${redirectUrl !== "/chatbots" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
              className="auth-btn auth-btn-spaced"
            >
              <span>Go to Login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <AuthBrandPanel
        headline="You're one step away from capturing more leads"
        subtext="Join thousands of service professionals already growing their business with AI chatbots."
        testimonial={{
          quote:
            "Setting up took less than 5 minutes. Within the first day, our chatbot booked 3 consultations while I was in court.",
          name: "James Rodriguez",
          role: "Immigration Attorney",
          initials: "JR",
        }}
      />

      <div className="auth-form-panel">
        <div className="auth-bg-mesh" />
        <Link href="/" className="auth-back-btn">
          <ChevronLeft size={16} /> <span>Home</span>
        </Link>

        <div className="auth-form-wrapper">
          <Logo size="big" />
          <div className="auth-header">
            <h1 className="auth-title">Create an account</h1>
            <p className="auth-subtitle">
              Already have an account?{" "}
              <Link href="/login" className="auth-link">
                Log in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-field">
              <label htmlFor="name" className="auth-form-label">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="auth-input"
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>

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
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="auth-form-field">
              <label htmlFor="password" className="auth-form-label">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
                placeholder="Create a strong password"
                disabled={isLoading}
              />
              <div
                className="auth-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeClosed size={18} /> : <Eye size={18} />}
              </div>
              <p className="auth-helper-text">
                Min 8 characters with uppercase, lowercase, number, and special
                character
              </p>
            </div>

            <div className="auth-form-field">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleChange}
                  required
                />
                <span>
                  I agree to the{" "}
                  <a href="//tos" target="_blank" rel="noopener noreferrer">
                    Terms of Use
                  </a>{" "}
                  and{" "}
                  <a
                    href="//privacypolicy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={isLoading || !btnActive}
            >
              {isLoading ? (
                <div className="auth-loading">
                  <div className="auth-spinner" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <span>Sign Up</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AuthLoadingFallback() {
  return (
    <div className="auth-page">
      <div className="auth-form-panel">
        <div className="auth-bg-mesh" />
        <div className="auth-form-wrapper">
          <Logo size="big" />
          <div className="auth-loading-container">
            <div className="auth-loading-spinner-large" />
            <p className="auth-loading-text">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <SignupContent />
    </Suspense>
  );
}

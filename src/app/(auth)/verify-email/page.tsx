"use client";

import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import Logo from "@/components/shared/Logo";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import "../auth-seira.css";

type VerifyState = "loading" | "success" | "already_verified" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState("error");
      setErrorMessage("No verification token provided.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setState("error");
          setErrorMessage(data.error || "Verification failed.");
          return;
        }
        if (data.alreadyVerified) {
          setState("already_verified");
        } else {
          setState("success");
        }
      })
      .catch(() => {
        setState("error");
        setErrorMessage("An error occurred. Please try again.");
      });
  }, [searchParams]);

  const getIcon = () => {
    if (state === "loading") return null;
    if (state === "error")
      return <div className="auth-error-icon">&#10007;</div>;
    return <div className="auth-success-icon">&#10003;</div>;
  };

  const getTitle = () => {
    switch (state) {
      case "loading":
        return "Verifying your email...";
      case "success":
        return "Email Verified!";
      case "already_verified":
        return "Already Verified";
      case "error":
        return "Verification Failed";
    }
  };

  const getSubtitle = () => {
    switch (state) {
      case "loading":
        return "Please wait while we verify your email address.";
      case "success":
        return "Your email has been verified. You can now log in to your account.";
      case "already_verified":
        return "Your email was already verified. You can log in to your account.";
      case "error":
        return errorMessage;
    }
  };

  return (
    <div className="auth-page">
      <AuthBrandPanel
        headline="Welcome to LeadBotStudio"
        subtext="AI chatbots that convert visitors into leads for your business."
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
          {state === "loading" ? (
            <div className="auth-loading">
              <div className="auth-spinner" />
              <span>Verifying...</span>
            </div>
          ) : (
            <>
              {getIcon()}
              <div className="auth-header">
                <h1 className="auth-title">{getTitle()}</h1>
                <p className="auth-subtitle">{getSubtitle()}</p>
              </div>

              <Link href="/login" className="auth-btn auth-btn-spaced">
                <span>Go to Login</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function VerifyEmailFallback() {
  return (
    <div className="auth-page">
      <div className="auth-form-panel">
        <div className="auth-bg-mesh" />
        <div className="auth-form-wrapper">
          <Logo size="big" />
          <div className="auth-loading">
            <div className="auth-spinner" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

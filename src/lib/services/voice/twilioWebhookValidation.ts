import type { NextRequest } from "next/server";
import twilio from "twilio";

type ValidationResult = { valid: true } | { valid: false; reason: string };

export function validateTwilioWebhook(
  request: NextRequest,
  formParams: Record<string, string>,
): ValidationResult {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    if (process.env.NODE_ENV !== "production") return { valid: true };
    return { valid: false, reason: "TWILIO_AUTH_TOKEN not configured" };
  }

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) {
    return { valid: false, reason: "Missing X-Twilio-Signature header" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const url = appUrl
    ? `${appUrl}${new URL(request.url).pathname}`
    : request.url;

  const isValid = twilio.validateRequest(authToken, signature, url, formParams);

  if (!isValid) {
    return { valid: false, reason: "Invalid signature" };
  }

  return { valid: true };
}

export function formDataToParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function getEmailFrom(): string {
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM environment variable is required");
  }
  return process.env.EMAIL_FROM;
}

const APP_NAME = process.env.APP_NAME || "LeadBotStudio";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const { data, error } = await getResend().emails.send({
      from: getEmailFrom(),
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Failed to send email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Email sent immediately:", data?.id);
    return { success: true, id: data?.id, queued: false };
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to LeadBotStudio</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #E5E9E7;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E5E9E7; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(7, 18, 5, 0.08);">

                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #A5C1CB 0%, #708485 100%); padding: 48px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      Welcome to the Family
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #FFFFFF; font-size: 18px; font-weight: 400; opacity: 0.95;">
                      We're excited to have you here
                    </p>
                  </td>
                </tr>

                <!-- Body content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Hey there! 👋
                    </p>
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      You've just taken the first step to joining <strong style="color: #708485;">LeadBotStudio</strong>, and we couldn't be happier to welcome you into our community.
                    </p>
                    <p style="margin: 0 0 32px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Let's verify your email address to get you started:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                          <a href="${verificationUrl}"
                             style="display: inline-block; background-color: #071205; color: #FFFFFF; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(7, 18, 5, 0.2);">
                            Verify My Email
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Info box -->
                    <div style="background-color: #E5E9E7; border-left: 4px solid #A5C1CB; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                      <p style="margin: 0 0 12px 0; color: #071205; font-size: 14px; font-weight: 600;">
                        What happens next?
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #708485; font-size: 14px; line-height: 1.7;">
                        <li>Click the button to verify your email</li>
                        <li>Complete your profile setup</li>
                        <li>Start exploring LeadBotStudio's features</li>
                      </ul>
                    </div>

                    <!-- Alternative link -->
                    <div style="padding: 24px; background-color: #F8F9FA; border-radius: 8px; margin-bottom: 24px;">
                      <p style="margin: 0 0 12px 0; color: #708485; font-size: 13px; text-align: center;">
                        Button not working? Copy and paste this link:
                      </p>
                      <p style="margin: 0; color: #708485; font-size: 12px; word-break: break-all; text-align: center; font-family: monospace;">
                        ${verificationUrl}
                      </p>
                    </div>

                    <p style="margin: 0; color: #708485; font-size: 13px; line-height: 1.6; text-align: center;">
                      This link expires in 24 hours for security. If you didn't create this account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #E5E9E7; padding: 32px 40px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #071205; font-size: 18px; font-weight: 600;">
                      LeadBotStudio
                    </p>
                    <p style="margin: 0; color: #708485; font-size: 13px;">
                      AI chatbots that convert visitors into leads
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to LeadBotStudio - Let's verify your email 🎉",
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - LeadBotStudio</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #E5E9E7;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E5E9E7; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(7, 18, 5, 0.08);">

                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #708485 0%, #A5C1CB 100%); padding: 48px 40px; text-align: center;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px; text-align: center; line-height: 72px;">
                      <span style="font-size: 36px; vertical-align: middle;">🔒</span>
                    </div>
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      Reset Your Password
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #FFFFFF; font-size: 18px; font-weight: 400; opacity: 0.95;">
                      We're here to help you get back in
                    </p>
                  </td>
                </tr>

                <!-- Body content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Hi there,
                    </p>
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      We received a request to reset the password for your <strong style="color: #708485;">LeadBotStudio</strong> account. No worries — it happens to the best of us!
                    </p>
                    <p style="margin: 0 0 32px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Click the button below to create a new password:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                          <a href="${resetUrl}"
                             style="display: inline-block; background-color: #071205; color: #FFFFFF; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(7, 18, 5, 0.2);">
                            Reset My Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Security info box -->
                    <div style="background-color: #FFF8E1; border-left: 4px solid #708485; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                      <p style="margin: 0 0 12px 0; color: #071205; font-size: 14px; font-weight: 600;">
                        ⚡ Important Security Info
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #708485; font-size: 14px; line-height: 1.7;">
                        <li>This link expires in 1 hour for your security</li>
                        <li>The link can only be used once</li>
                        <li>If you didn't request this, you can safely ignore it</li>
                      </ul>
                    </div>

                    <!-- Alternative link -->
                    <div style="padding: 24px; background-color: #F8F9FA; border-radius: 8px; margin-bottom: 24px;">
                      <p style="margin: 0 0 12px 0; color: #708485; font-size: 13px; text-align: center;">
                        Button not working? Copy and paste this link:
                      </p>
                      <p style="margin: 0; color: #708485; font-size: 12px; word-break: break-all; text-align: center; font-family: monospace;">
                        ${resetUrl}
                      </p>
                    </div>

                    <div style="background-color: #E5E9E7; padding: 20px; border-radius: 8px; text-align: center;">
                      <p style="margin: 0; color: #708485; font-size: 14px; line-height: 1.6;">
                        <strong>Didn't request this?</strong><br>
                        If you didn't ask to reset your password, please ignore this email. Your account is still secure.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #E5E9E7; padding: 32px 40px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #071205; font-size: 18px; font-weight: 600;">
                      LeadBotStudio
                    </p>
                    <p style="margin: 0; color: #708485; font-size: 13px;">
                      AI chatbots that convert visitors into leads
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Reset Your Password - LeadBotStudio",
    html,
  });
}

// Lead capture notification email
export async function sendLeadCaptureNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  leadName: string,
  leadEmail: string,
  chatbotName: string,
  chatbotId: string,
  source: "LEAD_FORM" | "BOOKING_FALLBACK",
  leadPhone?: string,
) {
  const sourceDisplay =
    source === "LEAD_FORM" ? "Lead Form" : "Contact Capture";
  const leadsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/chatbots/${chatbotId}/leads`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Lead Captured - LeadBotStudio</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #E5E9E7;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E5E9E7; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(7, 18, 5, 0.08);">

                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 48px 40px; text-align: center;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px; text-align: center; line-height: 72px;">
                      <span style="font-size: 36px; vertical-align: middle;">&#127881;</span>
                    </div>
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      New Lead Captured!
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #FFFFFF; font-size: 18px; font-weight: 400; opacity: 0.95;">
                      Someone just submitted their info via ${chatbotName}
                    </p>
                  </td>
                </tr>

                <!-- Body content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Hi ${recipientName},
                    </p>
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Great news! A new lead has been captured through your chatbot <strong style="color: #059669;">${chatbotName}</strong>.
                    </p>

                    <!-- Lead details box -->
                    <div style="background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                      <p style="margin: 0 0 16px 0; color: #071205; font-size: 14px; font-weight: 600;">
                        Lead Details
                      </p>
                      <table style="width: 100%;">
                        <tr>
                          <td style="color: #708485; font-size: 14px; padding-bottom: 8px; width: 80px;">Name:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${leadName}</td>
                        </tr>
                        <tr>
                          <td style="color: #708485; font-size: 14px; padding-bottom: 8px;">Email:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${leadEmail}</td>
                        </tr>
                        ${
                          leadPhone
                            ? `
                        <tr>
                          <td style="color: #708485; font-size: 14px; padding-bottom: 8px;">Phone:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${leadPhone}</td>
                        </tr>
                        `
                            : ""
                        }
                        <tr>
                          <td style="color: #708485; font-size: 14px;">Source:</td>
                          <td style="color: #071205; font-size: 14px; font-weight: 500;">${sourceDisplay}</td>
                        </tr>
                      </table>
                    </div>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                          <a href="${leadsUrl}"
                             style="display: inline-block; background-color: #071205; color: #FFFFFF; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(7, 18, 5, 0.2);">
                            View Lead in Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Alternative link -->
                    <div style="padding: 24px; background-color: #F8F9FA; border-radius: 8px;">
                      <p style="margin: 0 0 12px 0; color: #708485; font-size: 13px; text-align: center;">
                        Button not working? Copy and paste this link:
                      </p>
                      <p style="margin: 0; color: #708485; font-size: 12px; word-break: break-all; text-align: center; font-family: monospace;">
                        ${leadsUrl}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #E5E9E7; padding: 32px 40px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #071205; font-size: 18px; font-weight: 600;">
                      LeadBotStudio
                    </p>
                    <p style="margin: 0; color: #708485; font-size: 13px;">
                      AI chatbots that convert visitors into leads
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `New lead from ${chatbotName}: ${leadName}`,
    html,
  });
}

// Account lockout notification email (to user)
export async function sendAccountLockoutEmail(
  userEmail: string,
  userName: string,
  lockoutMinutes: number,
  ipAddress: string,
  userAgent: string,
  attemptTime: Date,
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`;
  const formattedTime = attemptTime.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Security Alert - LeadBotStudio</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #E5E9E7;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E5E9E7; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(7, 18, 5, 0.08);">

                <!-- Header with warning gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 48px 40px; text-align: center;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px; text-align: center; line-height: 72px;">
                      <span style="font-size: 36px; vertical-align: middle;">&#9888;</span>
                    </div>
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      Account Temporarily Locked
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #FFFFFF; font-size: 18px; font-weight: 400; opacity: 0.95;">
                      Multiple failed login attempts detected
                    </p>
                  </td>
                </tr>

                <!-- Body content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Hi ${userName || "there"},
                    </p>
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      We've detected multiple failed login attempts on your <strong style="color: #708485;">LeadBotStudio</strong> account. For your security, we've temporarily locked your account for <strong>${lockoutMinutes} minutes</strong>.
                    </p>

                    <!-- Alert box -->
                    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                      <p style="margin: 0 0 16px 0; color: #991B1B; font-size: 14px; font-weight: 600;">
                        Suspicious Activity Details
                      </p>
                      <table style="width: 100%;">
                        <tr>
                          <td style="color: #991B1B; font-size: 14px; padding-bottom: 8px; width: 100px;">Time:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px;">${formattedTime}</td>
                        </tr>
                        <tr>
                          <td style="color: #991B1B; font-size: 14px; padding-bottom: 8px;">IP Address:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-family: monospace;">${ipAddress}</td>
                        </tr>
                        <tr>
                          <td style="color: #991B1B; font-size: 14px;">Device:</td>
                          <td style="color: #071205; font-size: 14px; word-break: break-word;">${userAgent.substring(0, 80)}${userAgent.length > 80 ? "..." : ""}</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Info box -->
                    <div style="background-color: #E5E9E7; border-left: 4px solid #A5C1CB; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                      <p style="margin: 0 0 12px 0; color: #071205; font-size: 14px; font-weight: 600;">
                        What should you do?
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #708485; font-size: 14px; line-height: 1.7;">
                        <li><strong>If this was you:</strong> Wait ${lockoutMinutes} minutes and try again. If you've forgotten your password, reset it below.</li>
                        <li><strong>If this wasn't you:</strong> Someone may be trying to access your account. We recommend resetting your password immediately.</li>
                      </ul>
                    </div>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                          <a href="${resetUrl}"
                             style="display: inline-block; background-color: #071205; color: #FFFFFF; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(7, 18, 5, 0.2);">
                            Reset My Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; color: #708485; font-size: 13px; line-height: 1.6; text-align: center;">
                      Your account will automatically unlock after ${lockoutMinutes} minutes. Password reset works even during lockout.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #E5E9E7; padding: 32px 40px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #071205; font-size: 18px; font-weight: 600;">
                      LeadBotStudio
                    </p>
                    <p style="margin: 0; color: #708485; font-size: 13px;">
                      AI chatbots that convert visitors into leads
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject:
      "Security Alert: Your LeadBotStudio account has been temporarily locked",
    html,
  });
}

// Account lockout notification email (to admins)
export async function sendAdminLockoutAlertEmail(
  adminEmails: string[],
  userName: string,
  userEmail: string,
  ipAddress: string,
  userAgent: string,
  attemptTime: Date,
  failedAttempts: number,
) {
  const formattedTime = attemptTime.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/audit-logs`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Alert: Account Lockout - LeadBotStudio</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #E5E9E7;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E5E9E7; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(7, 18, 5, 0.08);">

                <!-- Header with admin warning gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); padding: 48px 40px; text-align: center;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px; text-align: center; line-height: 72px;">
                      <span style="font-size: 36px; vertical-align: middle;">&#128274;</span>
                    </div>
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      Admin Security Alert
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #FFFFFF; font-size: 18px; font-weight: 400; opacity: 0.95;">
                      Account lockout triggered due to suspicious activity
                    </p>
                  </td>
                </tr>

                <!-- Body content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Hello Admin,
                    </p>
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      An account has been automatically locked due to <strong>${failedAttempts} consecutive failed login attempts</strong>. This could indicate a brute-force attack or a user who has forgotten their credentials.
                    </p>

                    <!-- User details box -->
                    <div style="background-color: #FFF7ED; border-left: 4px solid #F97316; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                      <p style="margin: 0 0 16px 0; color: #9A3412; font-size: 14px; font-weight: 600;">
                        Affected User Details
                      </p>
                      <table style="width: 100%;">
                        <tr>
                          <td style="color: #9A3412; font-size: 14px; padding-bottom: 8px; width: 120px;">Name:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${userName || "Not set"}</td>
                        </tr>
                        <tr>
                          <td style="color: #9A3412; font-size: 14px; padding-bottom: 8px;">Email:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${userEmail}</td>
                        </tr>
                        <tr>
                          <td style="color: #9A3412; font-size: 14px; padding-bottom: 8px;">Failed Attempts:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${failedAttempts}</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Attack details box -->
                    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                      <p style="margin: 0 0 16px 0; color: #991B1B; font-size: 14px; font-weight: 600;">
                        Attack Origin Details
                      </p>
                      <table style="width: 100%;">
                        <tr>
                          <td style="color: #991B1B; font-size: 14px; padding-bottom: 8px; width: 120px;">Lockout Time:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px;">${formattedTime}</td>
                        </tr>
                        <tr>
                          <td style="color: #991B1B; font-size: 14px; padding-bottom: 8px;">IP Address:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-family: monospace;">${ipAddress}</td>
                        </tr>
                        <tr>
                          <td style="color: #991B1B; font-size: 14px;">User Agent:</td>
                          <td style="color: #071205; font-size: 14px; word-break: break-word;">${userAgent.substring(0, 100)}${userAgent.length > 100 ? "..." : ""}</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Recommendations box -->
                    <div style="background-color: #E5E9E7; border-left: 4px solid #A5C1CB; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                      <p style="margin: 0 0 12px 0; color: #071205; font-size: 14px; font-weight: 600;">
                        Recommended Actions
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #708485; font-size: 14px; line-height: 1.7;">
                        <li>Review the audit logs for this user's recent activity</li>
                        <li>Check if the IP address is known or suspicious</li>
                        <li>Consider blocking the IP if malicious activity is confirmed</li>
                        <li>Contact the user if this appears to be a legitimate lockout</li>
                      </ul>
                    </div>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                          <a href="${dashboardUrl}"
                             style="display: inline-block; background-color: #071205; color: #FFFFFF; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(7, 18, 5, 0.2);">
                            View Audit Logs
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; color: #708485; font-size: 13px; line-height: 1.6; text-align: center;">
                      The account will automatically unlock after 20 minutes. No manual intervention is required unless suspicious activity is confirmed.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #E5E9E7; padding: 32px 40px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #071205; font-size: 18px; font-weight: 600;">
                      LeadBotStudio - Admin Alert
                    </p>
                    <p style="margin: 0; color: #708485; font-size: 13px;">
                      This is an automated security notification
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // Send to all admin emails
  const results = await Promise.allSettled(
    adminEmails.map((email) =>
      sendEmail({
        to: email,
        subject: `[ADMIN ALERT] Account lockout: ${userEmail}`,
        html,
      }),
    ),
  );

  return results;
}

// Booking notification email (to chatbot owner/admins)
export async function sendBookingNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  contactName: string,
  contactEmail: string,
  contactPhone: string,
  chatbotName: string,
  chatbotId: string,
  categoryName: string,
  subCategoryName: string | undefined,
  locationName: string,
  locationAddress: string,
  appointmentDate: string,
  appointmentTime: string,
  caseDescription?: string,
) {
  const bookingsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/chatbots/${chatbotId}/bookings`;
  const serviceType = subCategoryName
    ? `${categoryName} - ${subCategoryName}`
    : categoryName;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Booking Request - LeadBotStudio</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #E5E9E7;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E5E9E7; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(7, 18, 5, 0.08);">

                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%); padding: 48px 40px; text-align: center;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px; text-align: center; line-height: 72px;">
                      <span style="font-size: 36px; vertical-align: middle;">&#128197;</span>
                    </div>
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      New Booking Request!
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #FFFFFF; font-size: 18px; font-weight: 400; opacity: 0.95;">
                      Someone scheduled an appointment via ${chatbotName}
                    </p>
                  </td>
                </tr>

                <!-- Body content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Hi ${recipientName},
                    </p>
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Great news! A new appointment has been booked through your chatbot <strong style="color: #B91C1C;">${chatbotName}</strong>.
                    </p>

                    <!-- Appointment details box -->
                    <div style="background-color: #FEF2F2; border-left: 4px solid #B91C1C; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                      <p style="margin: 0 0 16px 0; color: #071205; font-size: 14px; font-weight: 600;">
                        Appointment Details
                      </p>
                      <table style="width: 100%;">
                        <tr>
                          <td style="color: #708485; font-size: 14px; padding-bottom: 8px; width: 100px;">Service:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${serviceType}</td>
                        </tr>
                        <tr>
                          <td style="color: #708485; font-size: 14px; padding-bottom: 8px;">Date:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${appointmentDate}</td>
                        </tr>
                        <tr>
                          <td style="color: #708485; font-size: 14px; padding-bottom: 8px;">Time:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${appointmentTime}</td>
                        </tr>
                        <tr>
                          <td style="color: #708485; font-size: 14px;">Location:</td>
                          <td style="color: #071205; font-size: 14px; font-weight: 500;">${locationName}<br><span style="font-weight: 400; color: #708485;">${locationAddress}</span></td>
                        </tr>
                      </table>
                    </div>

                    <!-- Contact details box -->
                    <div style="background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                      <p style="margin: 0 0 16px 0; color: #071205; font-size: 14px; font-weight: 600;">
                        Contact Information
                      </p>
                      <table style="width: 100%;">
                        <tr>
                          <td style="color: #708485; font-size: 14px; padding-bottom: 8px; width: 80px;">Name:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${contactName}</td>
                        </tr>
                        <tr>
                          <td style="color: #708485; font-size: 14px; padding-bottom: 8px;">Email:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;"><a href="mailto:${contactEmail}" style="color: #071205;">${contactEmail}</a></td>
                        </tr>
                        <tr>
                          <td style="color: #708485; font-size: 14px;">Phone:</td>
                          <td style="color: #071205; font-size: 14px; font-weight: 500;"><a href="tel:${contactPhone}" style="color: #071205;">${contactPhone}</a></td>
                        </tr>
                      </table>
                    </div>

                    ${
                      caseDescription
                        ? `
                    <!-- Case description box -->
                    <div style="background-color: #F8F9FA; border-left: 4px solid #708485; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                      <p style="margin: 0 0 12px 0; color: #071205; font-size: 14px; font-weight: 600;">
                        Case Description
                      </p>
                      <p style="margin: 0; color: #071205; font-size: 14px; line-height: 1.6; font-style: italic;">
                        "${caseDescription}"
                      </p>
                    </div>
                    `
                        : ""
                    }

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                          <a href="${bookingsUrl}"
                             style="display: inline-block; background-color: #071205; color: #FFFFFF; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(7, 18, 5, 0.2);">
                            View Booking in Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Alternative link -->
                    <div style="padding: 24px; background-color: #F8F9FA; border-radius: 8px;">
                      <p style="margin: 0 0 12px 0; color: #708485; font-size: 13px; text-align: center;">
                        Button not working? Copy and paste this link:
                      </p>
                      <p style="margin: 0; color: #708485; font-size: 12px; word-break: break-all; text-align: center; font-family: monospace;">
                        ${bookingsUrl}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #E5E9E7; padding: 32px 40px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #071205; font-size: 18px; font-weight: 600;">
                      LeadBotStudio
                    </p>
                    <p style="margin: 0; color: #708485; font-size: 13px;">
                      AI chatbots that convert visitors into leads
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `New booking from ${chatbotName}: ${contactName} - ${appointmentDate} at ${appointmentTime}`,
    html,
  });
}

/**
 * Send text request notification email
 */
export async function sendTextRequestNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  contactName: string,
  contactPhone: string,
  contactEmail: string | null,
  chatbotName: string,
  chatbotId: string,
  message: string,
) {
  const leadsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/chatbots/${chatbotId}/leads`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Text Request - LeadBotStudio</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #E5E9E7;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E5E9E7; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(7, 18, 5, 0.08);">

                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); padding: 48px 40px; text-align: center;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px; text-align: center; line-height: 72px;">
                      <span style="font-size: 36px; vertical-align: middle;">&#128172;</span>
                    </div>
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      New Text Request!
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #FFFFFF; font-size: 18px; font-weight: 400; opacity: 0.95;">
                      Someone wants to connect via ${chatbotName}
                    </p>
                  </td>
                </tr>

                <!-- Body content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Hi ${recipientName},
                    </p>
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      You received a new text request through your chatbot <strong style="color: #2563EB;">${chatbotName}</strong>. They're waiting to hear back from you!
                    </p>

                    <!-- Contact details box -->
                    <div style="background-color: #EFF6FF; border-left: 4px solid #2563EB; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                      <p style="margin: 0 0 16px 0; color: #071205; font-size: 14px; font-weight: 600;">
                        Contact Information
                      </p>
                      <table style="width: 100%;">
                        <tr>
                          <td style="color: #708485; font-size: 14px; padding-bottom: 8px; width: 80px;">Name:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${contactName}</td>
                        </tr>
                        <tr>
                          <td style="color: #708485; font-size: 14px; padding-bottom: 8px;">Phone:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;"><a href="tel:${contactPhone}" style="color: #071205;">${contactPhone}</a></td>
                        </tr>
                        ${
                          contactEmail
                            ? `
                        <tr>
                          <td style="color: #708485; font-size: 14px;">Email:</td>
                          <td style="color: #071205; font-size: 14px; font-weight: 500;"><a href="mailto:${contactEmail}" style="color: #071205;">${contactEmail}</a></td>
                        </tr>
                        `
                            : ""
                        }
                      </table>
                    </div>

                    <!-- Message box -->
                    <div style="background-color: #F8F9FA; border-left: 4px solid #708485; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                      <p style="margin: 0 0 12px 0; color: #071205; font-size: 14px; font-weight: 600;">
                        Their Message
                      </p>
                      <p style="margin: 0; color: #071205; font-size: 14px; line-height: 1.6; font-style: italic;">
                        "${message}"
                      </p>
                    </div>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                          <a href="${leadsUrl}"
                             style="display: inline-block; background-color: #071205; color: #FFFFFF; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(7, 18, 5, 0.2);">
                            View in Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Alternative link -->
                    <div style="padding: 24px; background-color: #F8F9FA; border-radius: 8px;">
                      <p style="margin: 0 0 12px 0; color: #708485; font-size: 13px; text-align: center;">
                        Button not working? Copy and paste this link:
                      </p>
                      <p style="margin: 0; color: #708485; font-size: 12px; word-break: break-all; text-align: center; font-family: monospace;">
                        ${leadsUrl}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #E5E9E7; padding: 32px 40px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #071205; font-size: 18px; font-weight: 600;">
                      LeadBotStudio
                    </p>
                    <p style="margin: 0; color: #708485; font-size: 13px;">
                      AI chatbots that convert visitors into leads
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `New text request from ${chatbotName}: ${contactName} - ${contactPhone}`,
    html,
  });
}

export async function sendOrganizationInviteEmail(
  recipientEmail: string,
  organizationName: string,
  inviterName: string,
  inviteUrl: string,
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited - ${APP_NAME}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #E5E9E7;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E5E9E7; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(7, 18, 5, 0.08);">

                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%); padding: 48px 40px; text-align: center;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px; text-align: center; line-height: 72px;">
                      <span style="font-size: 36px; vertical-align: middle;">&#129309;</span>
                    </div>
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      You're Invited!
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #FFFFFF; font-size: 18px; font-weight: 400; opacity: 0.95;">
                      Join ${organizationName} on ${APP_NAME}
                    </p>
                  </td>
                </tr>

                <!-- Body content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Hi there,
                    </p>
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      <strong>${inviterName}</strong> has invited you to join <strong style="color: #7C3AED;">${organizationName}</strong> on ${APP_NAME}.
                    </p>

                    <!-- Info box -->
                    <div style="background-color: #F5F3FF; border-left: 4px solid #7C3AED; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                      <p style="margin: 0; color: #071205; font-size: 14px; line-height: 1.6;">
                        As a team member, you'll be able to manage chatbots, view leads, and collaborate with your team.
                      </p>
                    </div>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                          <a href="${inviteUrl}"
                             style="display: inline-block; background-color: #071205; color: #FFFFFF; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(7, 18, 5, 0.2);">
                            Accept Invitation
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiry notice -->
                    <p style="margin: 0 0 24px 0; color: #708485; font-size: 14px; text-align: center;">
                      This invitation expires in 7 days.
                    </p>

                    <!-- Alternative link -->
                    <div style="padding: 24px; background-color: #F8F9FA; border-radius: 8px;">
                      <p style="margin: 0 0 12px 0; color: #708485; font-size: 13px; text-align: center;">
                        Button not working? Copy and paste this link:
                      </p>
                      <p style="margin: 0; color: #708485; font-size: 12px; word-break: break-all; text-align: center; font-family: monospace;">
                        ${inviteUrl}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #E5E9E7; padding: 32px 40px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #071205; font-size: 18px; font-weight: 600;">
                      ${APP_NAME}
                    </p>
                    <p style="margin: 0; color: #708485; font-size: 13px;">
                      AI chatbots that convert visitors into leads
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `${inviterName} invited you to join ${organizationName} on ${APP_NAME}`,
    html,
  });
}

export async function sendConversationLimitEmail(
  recipientEmail: string,
  recipientName: string,
  chatbotName: string,
  chatbotId: string,
  currentCount: number,
  limit: number,
) {
  const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`;
  const chatbotUrl = `${process.env.NEXT_PUBLIC_APP_URL}/chatbots/${chatbotId}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Conversation Limit Reached - ${APP_NAME}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #E5E9E7;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E5E9E7; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(7, 18, 5, 0.08);">

                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 48px 40px; text-align: center;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px; text-align: center; line-height: 72px;">
                      <span style="font-size: 36px; vertical-align: middle;">&#9888;&#65039;</span>
                    </div>
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      Conversation Limit Reached
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #FFFFFF; font-size: 18px; font-weight: 400; opacity: 0.95;">
                      ${chatbotName} can no longer serve new visitors
                    </p>
                  </td>
                </tr>

                <!-- Body content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Hi ${recipientName},
                    </p>
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      Your chatbot <strong style="color: #D97706;">${chatbotName}</strong> has reached its monthly conversation limit of <strong>${limit}</strong> conversations (currently at ${currentCount}).
                    </p>
                    <p style="margin: 0 0 24px 0; color: #071205; font-size: 16px; line-height: 1.6;">
                      New visitors will see a temporary unavailability message until the limit resets next month, or you upgrade your plan.
                    </p>

                    <!-- Limit details box -->
                    <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="color: #708485; font-size: 14px; padding-bottom: 8px; width: 120px;">Chatbot:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${chatbotName}</td>
                        </tr>
                        <tr>
                          <td style="color: #708485; font-size: 14px; padding-bottom: 8px;">Conversations:</td>
                          <td style="color: #071205; font-size: 14px; padding-bottom: 8px; font-weight: 500;">${currentCount} / ${limit}</td>
                        </tr>
                        <tr>
                          <td style="color: #708485; font-size: 14px;">Status:</td>
                          <td style="color: #D97706; font-size: 14px; font-weight: 600;">Limit Reached</td>
                        </tr>
                      </table>
                    </div>

                    <!-- CTA Buttons -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 16px 0;">
                          <a href="${billingUrl}"
                             style="display: inline-block; background-color: #071205; color: #FFFFFF; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(7, 18, 5, 0.2);">
                            Upgrade Plan
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                          <a href="${chatbotUrl}"
                             style="color: #708485; font-size: 14px; text-decoration: underline;">
                            View Chatbot Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Alternative link -->
                    <div style="padding: 24px; background-color: #F8F9FA; border-radius: 8px;">
                      <p style="margin: 0 0 12px 0; color: #708485; font-size: 13px; text-align: center;">
                        Button not working? Copy and paste this link:
                      </p>
                      <p style="margin: 0; color: #708485; font-size: 12px; word-break: break-all; text-align: center; font-family: monospace;">
                        ${billingUrl}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #E5E9E7; padding: 32px 40px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #071205; font-size: 18px; font-weight: 600;">
                      ${APP_NAME}
                    </p>
                    <p style="margin: 0; color: #708485; font-size: 13px;">
                      AI chatbots that convert visitors into leads
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Action required: ${chatbotName} has reached its conversation limit`,
    html,
  });
}

import {
  verifyBackupCode,
  verifyMFAToken,
  needsMfaVerification,
  hasDeviceOrIpChanged,
  requiresOrganizationMfaSetup,
} from "@/lib/auth/mfa";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { generateMfaSetupToken } from "@/lib/auth/tokens";
import { loginSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/db";
import {
  checkAuthRateLimit,
  getClientIp,
  buildRateLimitHeaders,
  formatRateLimitError,
  resetAuthRateLimit,
} from "@/lib/middleware/authRateLimiter";
import { logAuthEvent } from "@/lib/utils/audit";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_DURATION_MS } from "@/lib/auth/constants";
import { getAdminEmails } from "@/lib/auth/admin";
import {
  sendAccountLockoutEmail,
  sendAdminLockoutAlertEmail,
} from "@/lib/email/resend";
import {
  checkLockoutStatus,
  calculateFailedAttemptResult,
  shouldResetFailedAttempts,
  LOCKOUT_CONFIG,
} from "@/lib/auth/lockout";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);
    const { email, password, mfaToken } = validatedData;

    // Check rate limit
    const clientIp = getClientIp(request.headers);
    const rateLimitResult = await checkAuthRateLimit("login", clientIp, email);

    if (!rateLimitResult.allowed) {
      await logAuthEvent(
        "LOGIN_FAILED",
        undefined,
        { email, reason: "Rate limited", ip: clientIp },
        request,
      );
      return NextResponse.json(
        { error: formatRateLimitError(rateLimitResult) },
        { status: 429, headers: buildRateLimitHeaders(rateLimitResult) },
      );
    }

    // Step 1: Find user with basic information and organization
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isActive: true,
        isVerified: true,
        mfaEnabled: true,
        mfaSecret: true,
        mfaBackupCodes: true,
        mfaLastVerifiedAt: true,
        failedLoginAttempts: true,
        lockoutUntil: true,
        lastFailedLoginAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            subtitle: true,
            type: true,
            logoUrl: true,
            requireMFA: true, // Organization-level MFA requirement
          },
        },
      },
    });

    if (!user || !user.isActive) {
      await logAuthEvent(
        "LOGIN_FAILED",
        undefined,
        { email, reason: "User not found or inactive" },
        request,
      );
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Check if account is locked
    const lockoutStatus = checkLockoutStatus(user.lockoutUntil);
    if (lockoutStatus.isLocked) {
      await logAuthEvent(
        "LOGIN_FAILED",
        user.id,
        {
          reason: "Account locked",
          lockoutRemaining: lockoutStatus.remainingSeconds,
        },
        request,
      );
      return NextResponse.json(
        {
          error: "Account temporarily locked",
          lockedUntil: user.lockoutUntil,
          retryAfterSeconds: lockoutStatus.remainingSeconds,
        },
        {
          status: 423,
          headers: { "Retry-After": String(lockoutStatus.remainingSeconds) },
        },
      );
    }

    // Verify password (user.password can be null for SSO users)
    if (!user.password) {
      await logAuthEvent(
        "LOGIN_FAILED",
        user.id,
        { reason: "No password set (SSO user)" },
        request,
      );
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);
    const currentUserAgent = request.headers.get("user-agent") || "unknown";

    if (!isValidPassword) {
      const effectiveFailedAttempts = shouldResetFailedAttempts(
        user.lastFailedLoginAt,
      )
        ? 0
        : user.failedLoginAttempts;

      const attemptResult = calculateFailedAttemptResult(
        effectiveFailedAttempts,
      );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attemptResult.newFailedAttempts,
          lastFailedLoginAt: new Date(),
          ...(attemptResult.shouldLockout && {
            lockoutUntil: attemptResult.lockoutUntil,
          }),
        },
      });

      const lockoutMinutes = Math.ceil(
        LOCKOUT_CONFIG.LOCKOUT_DURATION_MS / 60000,
      );

      await logAuthEvent(
        "LOGIN_FAILED",
        user.id,
        {
          reason: attemptResult.shouldLockout
            ? "Account locked"
            : "Invalid password",
          failedAttempts: attemptResult.newFailedAttempts,
          ...(attemptResult.shouldLockout && {
            lockoutDurationMinutes: lockoutMinutes,
          }),
        },
        request,
      );

      if (attemptResult.shouldLockout) {
        const adminEmails = getAdminEmails();
        const attemptTime = new Date();

        // Send lockout notification emails in background (don't block the response)
        Promise.all([
          sendAccountLockoutEmail(
            user.email,
            user.name || "User",
            lockoutMinutes,
            clientIp,
            currentUserAgent,
            attemptTime,
          ),
          adminEmails.length > 0
            ? sendAdminLockoutAlertEmail(
                adminEmails,
                user.name || "Unknown",
                user.email,
                clientIp,
                currentUserAgent,
                attemptTime,
                attemptResult.newFailedAttempts,
              )
            : Promise.resolve(),
        ]).catch((emailError) => {
          // Log but don't fail the response if emails fail to send
          console.error(
            "Failed to send lockout notification emails:",
            emailError,
          );
        });

        return NextResponse.json(
          {
            error: "Account temporarily locked due to too many failed attempts",
            lockedUntil: attemptResult.lockoutUntil,
            retryAfterSeconds: Math.ceil(
              LOCKOUT_CONFIG.LOCKOUT_DURATION_MS / 1000,
            ),
          },
          {
            status: 423,
            headers: {
              "Retry-After": String(
                Math.ceil(LOCKOUT_CONFIG.LOCKOUT_DURATION_MS / 1000),
              ),
            },
          },
        );
      }

      return NextResponse.json(
        {
          error: "Invalid credentials",
          ...(attemptResult.isWarning && {
            warning: attemptResult.warningMessage,
            remainingAttempts: attemptResult.remainingAttempts,
          }),
        },
        { status: 401 },
      );
    }

    // Check if user email is verified
    if (!user.isVerified) {
      await logAuthEvent(
        "LOGIN_FAILED",
        user.id,
        { reason: "Email not verified" },
        request,
      );
      return NextResponse.json(
        {
          error: "Please verify your email before logging in",
          needsVerification: true,
          email: user.email,
        },
        { status: 403 },
      );
    }

    // Check if organization requires MFA but user hasn't set it up
    if (
      requiresOrganizationMfaSetup({
        organizationRequiresMfa: user.organization?.requireMFA ?? false,
        userMfaEnabled: user.mfaEnabled,
      })
    ) {
      await logAuthEvent(
        "LOGIN_FAILED",
        user.id,
        { reason: "Organization requires MFA but user has not enabled it" },
        request,
      );

      const mfaSetupToken = generateMfaSetupToken(user.id, user.email);

      return NextResponse.json(
        {
          error: "Your organization requires multi-factor authentication",
          mfaSetupRequired: true,
          mfaSetupToken,
          email: user.email,
        },
        { status: 403 },
      );
    }

    // Check for device/IP change by fetching user's last active session
    let deviceOrIpChangeRequiresMfa = false;
    if (user.mfaEnabled && user.mfaSecret) {
      const lastSession = await prisma.session.findFirst({
        where: { userId: user.id, isActive: true },
        orderBy: { createdAt: "desc" },
        select: { ipAddress: true, userAgent: true },
      });

      if (lastSession) {
        const changeCheck = hasDeviceOrIpChanged({
          lastIpAddress: lastSession.ipAddress,
          lastUserAgent: lastSession.userAgent,
          currentIpAddress: clientIp,
          currentUserAgent: currentUserAgent,
        });

        deviceOrIpChangeRequiresMfa = changeCheck.requiresMfa;

        if (changeCheck.requiresMfa) {
          await logAuthEvent(
            "LOGIN_FAILED",
            user.id,
            {
              reason: "Device or IP change detected",
              ipChanged: changeCheck.ipChanged,
              deviceChanged: changeCheck.deviceChanged,
              previousIp: lastSession.ipAddress,
              currentIp: clientIp,
            },
            request,
          );
        }
      }
    }

    // Handle MFA - check if verification is needed (time-based or device/IP change)
    let mfaVerified = false;
    const timeBasedMfaRequired = needsMfaVerification(user);
    const requiresMfaVerification =
      timeBasedMfaRequired || deviceOrIpChangeRequiresMfa;

    if (requiresMfaVerification) {
      // MFA verification required
      if (!mfaToken) {
        return NextResponse.json(
          {
            error: "MFA required",
            mfaRequired: true,
          },
          { status: 200 },
        );
      }

      // Try to verify as TOTP token first
      if (user.mfaSecret) {
        mfaVerified = verifyMFAToken(mfaToken, user.mfaSecret);
      }

      // If TOTP fails, try as backup code
      let remainingBackupCodes: string[] | undefined;
      if (!mfaVerified && user.mfaBackupCodes.length > 0) {
        const backupResult = await verifyBackupCode(
          mfaToken,
          user.mfaBackupCodes,
        );
        if (backupResult.isValid) {
          mfaVerified = true;
          remainingBackupCodes = backupResult.remainingCodes;
        }
      }

      if (!mfaVerified) {
        await logAuthEvent(
          "LOGIN_FAILED",
          user.id,
          { reason: "Invalid MFA token" },
          request,
        );
        return NextResponse.json(
          { error: "Invalid MFA token" },
          { status: 401 },
        );
      }

      // Batch update: mfaLastVerifiedAt and backup codes (if used) in single transaction
      const updateData: {
        mfaLastVerifiedAt: Date;
        mfaBackupCodes?: string[];
      } = {
        mfaLastVerifiedAt: new Date(),
      };

      if (remainingBackupCodes !== undefined) {
        updateData.mfaBackupCodes = remainingBackupCodes;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    } else {
      // MFA not needed (either not enabled or verified within last week)
      mfaVerified = true;
    }

    // Step 2: User authenticated successfully - no RBAC loading needed

    // Generate session ID and token
    const sessionId = nanoid();
    const sessionToken = nanoid(32);

    // Step 3: Parallelize session creation, user update, session cleanup, and audit logging
    const [session] = await Promise.all([
      // Create session in database
      prisma.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          token: sessionToken,
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            undefined,
          userAgent: request.headers.get("user-agent") || undefined,
          expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
        },
      }),
      // Update last login and reset failed attempts
      prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      }),
      // Log successful login
      logAuthEvent("LOGIN", user.id, undefined, request),
    ]);

    // Create iron-session (must be done after database operations)
    await createSession({
      userId: user.id,
      email: user.email,
      sessionId,
      mfaVerified,
      organization: user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            subtitle: user.organization.subtitle || undefined,
            type: user.organization.type || undefined,
            logoUrl: user.organization.logoUrl || undefined,
          }
        : undefined,
    });

    // Reset rate limit on successful login
    await resetAuthRateLimit("login", clientIp, email);

    return NextResponse.json({
      message: "Login successful",
      users: {
        id: user.id,
        email: user.email,
        name: user.name,
        mfaEnabled: user.mfaEnabled,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

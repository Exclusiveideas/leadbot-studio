/**
 * Account lockout utilities
 * Provides functions to calculate lockout state and warning messages
 */

export const LOCKOUT_CONFIG = {
  MAX_FAILED_ATTEMPTS: 7,
  WARNING_THRESHOLD: 5,
  LOCKOUT_DURATION_MS: 20 * 60 * 1000, // 20 minutes
  ATTEMPT_DECAY_MS: 12 * 60 * 60 * 1000, // 12 hours
} as const;

type LockoutCheckResult = {
  isLocked: boolean;
  remainingSeconds: number;
};

/**
 * Check if an account is currently locked
 */
export function checkLockoutStatus(
  lockoutUntil: Date | null,
): LockoutCheckResult {
  if (!lockoutUntil) {
    return { isLocked: false, remainingSeconds: 0 };
  }

  const now = Date.now();
  const lockoutTime = new Date(lockoutUntil).getTime();

  if (lockoutTime <= now) {
    return { isLocked: false, remainingSeconds: 0 };
  }

  return {
    isLocked: true,
    remainingSeconds: Math.ceil((lockoutTime - now) / 1000),
  };
}

/**
 * Determines if failed login attempts should be reset due to time decay.
 * Returns true if more than ATTEMPT_DECAY_MS (12 hours) has passed since last failure.
 */
export function shouldResetFailedAttempts(
  lastFailedLoginAt: Date | null,
): boolean {
  if (!lastFailedLoginAt) {
    return false;
  }

  const timeSinceLastFailure =
    Date.now() - new Date(lastFailedLoginAt).getTime();
  return timeSinceLastFailure > LOCKOUT_CONFIG.ATTEMPT_DECAY_MS;
}

type FailedAttemptResult = {
  shouldLockout: boolean;
  newFailedAttempts: number;
  lockoutUntil: Date | null;
  isWarning: boolean;
  remainingAttempts: number;
  warningMessage: string | null;
};

/**
 * Calculate the result of a failed login attempt
 */
export function calculateFailedAttemptResult(
  currentFailedAttempts: number,
): FailedAttemptResult {
  const newFailedAttempts = currentFailedAttempts + 1;
  const shouldLockout = newFailedAttempts >= LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS;
  const lockoutUntil = shouldLockout
    ? new Date(Date.now() + LOCKOUT_CONFIG.LOCKOUT_DURATION_MS)
    : null;

  const remainingAttempts =
    LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS - newFailedAttempts;
  const isWarning =
    newFailedAttempts >= LOCKOUT_CONFIG.WARNING_THRESHOLD && !shouldLockout;

  let warningMessage: string | null = null;
  if (isWarning) {
    warningMessage =
      remainingAttempts === 1
        ? "1 attempt remaining before account lockout"
        : `${remainingAttempts} attempts remaining before account lockout`;
  }

  return {
    shouldLockout,
    newFailedAttempts,
    lockoutUntil,
    isWarning,
    remainingAttempts,
    warningMessage,
  };
}

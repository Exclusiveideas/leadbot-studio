import { describe, expect, test, vi, beforeEach } from "vitest";
import type { TokenPayload } from "@/lib/auth/tokens";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    session: { updateMany: (...args: unknown[]) => mockUpdateMany(...args) },
  },
}));

vi.mock("@/lib/auth/tokens", () => ({
  generateResetToken: vi.fn().mockReturnValue("mock-reset-token"),
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
}));

vi.mock("@/lib/email/resend", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/middleware/authRateLimiter", () => ({
  checkAuthRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  buildRateLimitHeaders: vi.fn().mockReturnValue({}),
  formatRateLimitError: vi.fn().mockReturnValue("Rate limited"),
}));

import { POST } from "./route";
import { verifyToken } from "@/lib/auth/tokens";
import { NextRequest } from "next/server";

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validResetBody = {
  token: "valid-jwt-token",
  password: "NewPassword1!",
  confirmPassword: "NewPassword1!",
};

const basePayload: TokenPayload = {
  userId: "user-123",
  email: "test@example.com",
  type: "reset",
  iat: Math.floor(Date.now() / 1000),
};

const baseUser = {
  id: "user-123",
  email: "test@example.com",
  isActive: true,
  passwordChangedAt: null,
};

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockUpdateMany.mockResolvedValue({ count: 1 });
  });

  describe("token reuse prevention", () => {
    test("allows reset when passwordChangedAt is null (first use)", async () => {
      vi.mocked(verifyToken).mockReturnValue(basePayload);
      mockFindUnique.mockResolvedValue({
        ...baseUser,
        passwordChangedAt: null,
      });

      const response = await POST(createRequest(validResetBody));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Password reset successfully");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordChangedAt: expect.any(Date),
          }),
        }),
      );
    });

    test("rejects token issued before last password change", async () => {
      const tokenIssuedAt = Math.floor(Date.now() / 1000) - 600;
      const passwordChangedAfter = new Date((tokenIssuedAt + 300) * 1000);

      vi.mocked(verifyToken).mockReturnValue({
        ...basePayload,
        iat: tokenIssuedAt,
      });
      mockFindUnique.mockResolvedValue({
        ...baseUser,
        passwordChangedAt: passwordChangedAfter,
      });

      const response = await POST(createRequest(validResetBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("This reset link has already been used");
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    test("allows token issued after last password change (new request)", async () => {
      const passwordChangedBefore = new Date(Date.now() - 3600_000);
      const tokenIssuedAfter = Math.floor(Date.now() / 1000);

      vi.mocked(verifyToken).mockReturnValue({
        ...basePayload,
        iat: tokenIssuedAfter,
      });
      mockFindUnique.mockResolvedValue({
        ...baseUser,
        passwordChangedAt: passwordChangedBefore,
      });

      const response = await POST(createRequest(validResetBody));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Password reset successfully");
    });

    test("rejects token when iat equals passwordChangedAt exactly", async () => {
      const exactTime = Math.floor(Date.now() / 1000);

      vi.mocked(verifyToken).mockReturnValue({
        ...basePayload,
        iat: exactTime,
      });
      mockFindUnique.mockResolvedValue({
        ...baseUser,
        passwordChangedAt: new Date(exactTime * 1000),
      });

      const response = await POST(createRequest(validResetBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("This reset link has already been used");
    });
  });

  describe("password reset flow", () => {
    test("invalidates all active sessions on successful reset", async () => {
      vi.mocked(verifyToken).mockReturnValue(basePayload);
      mockFindUnique.mockResolvedValue(baseUser);

      await POST(createRequest(validResetBody));

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { userId: "user-123", isActive: true },
        data: { isActive: false },
      });
    });

    test("rejects invalid token type", async () => {
      vi.mocked(verifyToken).mockReturnValue({
        ...basePayload,
        type: "access",
      });

      const response = await POST(createRequest(validResetBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid token type");
    });

    test("rejects when user email does not match token email", async () => {
      vi.mocked(verifyToken).mockReturnValue(basePayload);
      mockFindUnique.mockResolvedValue({
        ...baseUser,
        email: "different@example.com",
      });

      const response = await POST(createRequest(validResetBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid token");
    });

    test("rejects expired/invalid token", async () => {
      vi.mocked(verifyToken).mockImplementation(() => {
        throw new Error("Invalid or expired token");
      });

      const response = await POST(createRequest(validResetBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid or expired token");
    });
  });

  describe("password reset request", () => {
    test("returns success message regardless of email existence", async () => {
      mockFindUnique.mockResolvedValue(null);

      const response = await POST(
        createRequest({ email: "nonexistent@example.com" }),
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        "If an account exists with this email, you will receive a password reset link",
      );
    });
  });
});

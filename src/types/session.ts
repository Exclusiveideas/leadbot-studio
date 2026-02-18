// Shared session types that can be used by both server and client components

export interface User {
  id: string;
  email: string;
  name: string | null;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  hasPassword: boolean;
  organizationRole: "OWNER" | "MEMBER";
  organization: {
    id: string;
    name: string;
    subtitle?: string | null;
    type?: string | null;
    logoUrl?: string | null;
    createdBy?: string | null;
    createdAt?: string;
    plan?: "FREE" | "BASIC" | "PRO" | "AGENCY" | null;
    subscriptionStatus?: string | null;
    cancelAtPeriodEnd?: boolean;
    trialEndsAt?: string | null;
  };
}

export interface ServerSessionData {
  user: User;
  session: {
    id: string;
    expiresAt: string;
  };
}

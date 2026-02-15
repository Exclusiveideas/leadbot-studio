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
    subtitle?: string;
    type?: string;
    logoUrl?: string;
    createdBy?: string;
    createdAt?: string;
  };
}

export interface ServerSessionData {
  user: User;
  session: {
    id: string;
    expiresAt: string;
  };
}

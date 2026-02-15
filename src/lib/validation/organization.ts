import { z } from "zod";

export const sendInviteSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(254, "Email too long")
    .transform((e) => e.toLowerCase().trim()),
  role: z.enum(["OWNER", "MEMBER"]).default("MEMBER"),
});

export const updateOrgSettingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["OWNER", "MEMBER"]),
});

export type SendInviteInput = z.infer<typeof sendInviteSchema>;
export type UpdateOrgSettingsInput = z.infer<typeof updateOrgSettingsSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

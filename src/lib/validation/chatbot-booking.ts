import { z } from "zod";

/**
 * Time slot schema for location availability
 */
export const timeSlotSchema = z.object({
  start: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  end: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
});

/**
 * Location schema
 */
export const bookingLocationSchema = z.object({
  id: z.string().min(1, "Location ID is required"),
  name: z.string().min(1, "Location name is required").max(100),
  address: z.string().min(1, "Address is required").max(500),
  timeSlots: z.array(timeSlotSchema),
  availableDays: z.array(z.string()),
});

/**
 * Sub-category schema
 */
export const subCategorySchema = z.object({
  id: z.string().min(1, "Sub-category ID is required"),
  name: z.string().min(1, "Sub-category name is required").max(100),
});

/**
 * Category schema
 */
export const bookingCategorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
  name: z.string().min(1, "Category name is required").max(100),
  subCategories: z.array(subCategorySchema).optional(),
});

/**
 * Booking appearance schema
 */
export const bookingAppearanceSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format")
    .default("#001F54"),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format")
    .default("#3B82F6"),
});

/**
 * Full booking configuration schema
 */
export const bookingConfigSchema = z.object({
  enabled: z.boolean().default(false),
  categories: z.array(bookingCategorySchema).default([]),
  locations: z.array(bookingLocationSchema).default([]),
  appearance: bookingAppearanceSchema.optional(),
  requireCaseDescription: z.boolean().default(true),
});

/**
 * Create/Update booking config schema
 */
export const updateBookingConfigSchema = bookingConfigSchema.partial();

/**
 * Public booking submission schema
 */
export const createBookingSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  categoryId: z.string().min(1, "Category is required"),
  categoryName: z.string().min(1, "Category name is required"),
  subCategoryId: z.string().optional(),
  subCategoryName: z.string().optional(),
  caseDescription: z.string().max(2000).optional(),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(30),
  locationId: z.string().min(1, "Location is required"),
  locationName: z.string().min(1, "Location name is required"),
  locationAddress: z.string().min(1, "Location address is required"),
  appointmentDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  appointmentTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
});

/**
 * Booking status update schema
 */
export const updateBookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});

/**
 * Type exports
 */
export type TimeSlot = z.infer<typeof timeSlotSchema>;
export type BookingLocation = z.infer<typeof bookingLocationSchema>;
export type SubCategory = z.infer<typeof subCategorySchema>;
export type BookingCategory = z.infer<typeof bookingCategorySchema>;
export type BookingAppearance = z.infer<typeof bookingAppearanceSchema>;
export type BookingConfig = z.infer<typeof bookingConfigSchema>;
export type UpdateBookingConfigInput = z.infer<
  typeof updateBookingConfigSchema
>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<
  typeof updateBookingStatusSchema
>;

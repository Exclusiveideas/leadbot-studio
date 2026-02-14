import type { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  CreateBookingInput,
  BookingConfig,
} from "@/lib/validation/chatbot-booking";

class ChatbotBookingService {
  /**
   * List all bookings for a chatbot with optional filters
   */
  async listBookings(
    chatbotId: string,
    options: {
      status?: BookingStatus;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
      offset?: number;
    } = {},
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    const { status, fromDate, toDate, limit = 50, offset = 0 } = options;

    const where: Prisma.ChatbotBookingWhereInput = {
      chatbotId,
      ...(status && { status }),
      ...(fromDate || toDate
        ? {
            appointmentDate: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {}),
    };

    const [bookings, total] = await Promise.all([
      db.chatbotBooking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.chatbotBooking.count({ where }),
    ]);

    return { bookings, total };
  }

  /**
   * Get a single booking by ID
   */
  async getBooking(
    bookingId: string,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    return db.chatbotBooking.findUnique({
      where: { id: bookingId },
      include: {
        chatbot: {
          select: {
            id: true,
            name: true,
            createdBy: true,
            organizationId: true,
          },
        },
      },
    });
  }

  /**
   * Create a new booking (public submission)
   */
  async createBooking(
    chatbotId: string,
    data: CreateBookingInput,
    metadata: { ipAddress?: string; userAgent?: string } = {},
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    return db.chatbotBooking.create({
      data: {
        chatbotId,
        sessionId: data.sessionId,
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        subCategoryId: data.subCategoryId,
        subCategoryName: data.subCategoryName,
        caseDescription: data.caseDescription,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        locationId: data.locationId,
        locationName: data.locationName,
        locationAddress: data.locationAddress,
        appointmentDate: new Date(data.appointmentDate),
        appointmentTime: data.appointmentTime,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    return db.chatbotBooking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  /**
   * Get booking configuration for a chatbot
   */
  async getBookingConfig(
    chatbotId: string,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ): Promise<BookingConfig | null> {
    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      select: { bookingConfig: true },
    });

    if (!chatbot?.bookingConfig) {
      return null;
    }

    return chatbot.bookingConfig as BookingConfig;
  }

  /**
   * Update booking configuration for a chatbot
   */
  async updateBookingConfig(
    chatbotId: string,
    config: Partial<BookingConfig>,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    const existingConfig = await this.getBookingConfig(chatbotId, db);
    const mergedConfig = {
      ...existingConfig,
      ...config,
    };

    return db.chatbot.update({
      where: { id: chatbotId },
      data: {
        bookingConfig: mergedConfig as Prisma.JsonObject,
      },
      select: {
        id: true,
        bookingConfig: true,
      },
    });
  }

  /**
   * Get booking statistics for a chatbot
   */
  async getBookingStats(
    chatbotId: string,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    const [total, pending, confirmed, cancelled, completed] = await Promise.all(
      [
        db.chatbotBooking.count({ where: { chatbotId } }),
        db.chatbotBooking.count({ where: { chatbotId, status: "PENDING" } }),
        db.chatbotBooking.count({ where: { chatbotId, status: "CONFIRMED" } }),
        db.chatbotBooking.count({ where: { chatbotId, status: "CANCELLED" } }),
        db.chatbotBooking.count({ where: { chatbotId, status: "COMPLETED" } }),
      ],
    );

    return { total, pending, confirmed, cancelled, completed };
  }

  /**
   * Check if a time slot is available (no existing booking)
   */
  async isTimeSlotAvailable(
    chatbotId: string,
    locationId: string,
    date: Date,
    time: string,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ): Promise<boolean> {
    const existingBooking = await db.chatbotBooking.findFirst({
      where: {
        chatbotId,
        locationId,
        appointmentDate: date,
        appointmentTime: time,
        status: { notIn: ["CANCELLED"] },
      },
    });

    return !existingBooking;
  }

  /**
   * Get available time slots for a location on a specific date
   */
  async getAvailableSlots(
    chatbotId: string,
    locationId: string,
    date: Date,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ): Promise<string[]> {
    const config = await this.getBookingConfig(chatbotId, db);
    if (!config) return [];

    const location = config.locations.find((l) => l.id === locationId);
    if (!location) return [];

    // Check if the selected date's day of week is available for this location
    const dayName = date
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    if (!location.availableDays.includes(dayName)) {
      return [];
    }

    // Get all time slot start times for this location
    const allSlots = location.timeSlots.map((slot) => slot.start);

    if (allSlots.length === 0) return [];

    // Filter out already booked times
    const existingBookings = await db.chatbotBooking.findMany({
      where: {
        chatbotId,
        locationId,
        appointmentDate: date,
        status: { notIn: ["CANCELLED"] },
      },
      select: { appointmentTime: true },
    });

    const bookedTimes = new Set(existingBookings.map((b) => b.appointmentTime));
    return allSlots.filter((slot) => !bookedTimes.has(slot));
  }
}

export const chatbotBookingService = new ChatbotBookingService();

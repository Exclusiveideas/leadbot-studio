import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatbotBookingService } from "@/lib/services/chatbotBookingService";
import { createBookingSchema } from "@/lib/validation/chatbot-booking";
import { notifyBookingCreated } from "@/lib/services/bookingNotificationService";

/**
 * Build CORS headers for public chatbot endpoints
 */
function buildCorsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
  };
}

/**
 * OPTIONS /api/public/chatbots/[id]/bookings
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin),
  });
}

/**
 * POST /api/public/chatbots/[id]/bookings
 * Create a new booking from the public widget
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const origin = request.headers.get("origin");

  try {
    const body = await request.json();

    const result = createBookingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.errors,
        },
        { status: 400, headers: buildCorsHeaders(origin) },
      );
    }

    const chatbot = await prisma.chatbot.findFirst({
      where: {
        OR: [{ id }, { embedCode: id }],
      },
      select: {
        id: true,
        name: true,
        allowedDomains: true,
        createdBy: true,
        organizationId: true,
        bookingConfig: true,
      },
    });

    if (!chatbot) {
      return NextResponse.json(
        { error: "Chatbot not found" },
        { status: 404, headers: buildCorsHeaders(origin) },
      );
    }

    if (
      !chatbot.allowedDomains.includes("*") &&
      !chatbot.allowedDomains.includes(origin || "")
    ) {
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403, headers: buildCorsHeaders(origin) },
      );
    }

    const bookingConfig = chatbot.bookingConfig as Record<
      string,
      unknown
    > | null;
    if (!bookingConfig?.enabled) {
      return NextResponse.json(
        { error: "Booking is not enabled for this chatbot" },
        { status: 400, headers: buildCorsHeaders(origin) },
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const booking = await chatbotBookingService.createBooking(
      chatbot.id,
      result.data,
      { ipAddress, userAgent },
    );

    notifyBookingCreated({
      chatbot: {
        id: chatbot.id,
        name: chatbot.name,
        createdBy: chatbot.createdBy,
        organizationId: chatbot.organizationId,
      },
      booking: {
        id: booking.id,
        firstName: booking.firstName,
        lastName: booking.lastName,
        email: booking.email,
        phone: booking.phone,
        categoryName: booking.categoryName,
        subCategoryName: booking.subCategoryName,
        locationName: booking.locationName,
        locationAddress: booking.locationAddress,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        caseDescription: booking.caseDescription,
      },
    }).catch((err) =>
      console.error("[Booking] Failed to send notifications:", err),
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          bookingId: booking.id,
          message: "Booking created successfully",
        },
      },
      { headers: buildCorsHeaders(origin) },
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500, headers: buildCorsHeaders(origin) },
    );
  }
}

/**
 * GET /api/public/chatbots/[id]/bookings/available-slots
 * Get available time slots for a location on a specific date
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const origin = request.headers.get("origin");

  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const dateStr = searchParams.get("date");

    if (!locationId || !dateStr) {
      return NextResponse.json(
        { error: "locationId and date are required" },
        { status: 400, headers: buildCorsHeaders(origin) },
      );
    }

    const chatbot = await prisma.chatbot.findFirst({
      where: {
        OR: [{ id }, { embedCode: id }],
      },
      select: {
        id: true,
        allowedDomains: true,
        bookingConfig: true,
      },
    });

    if (!chatbot) {
      return NextResponse.json(
        { error: "Chatbot not found" },
        { status: 404, headers: buildCorsHeaders(origin) },
      );
    }

    if (
      !chatbot.allowedDomains.includes("*") &&
      !chatbot.allowedDomains.includes(origin || "")
    ) {
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403, headers: buildCorsHeaders(origin) },
      );
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400, headers: buildCorsHeaders(origin) },
      );
    }

    const availableSlots = await chatbotBookingService.getAvailableSlots(
      chatbot.id,
      locationId,
      date,
    );

    return NextResponse.json(
      { data: availableSlots },
      { headers: buildCorsHeaders(origin) },
    );
  } catch (error) {
    console.error("Error getting available slots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: buildCorsHeaders(origin) },
    );
  }
}

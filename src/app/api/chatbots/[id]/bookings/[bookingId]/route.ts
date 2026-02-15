import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { chatbotBookingService } from "@/lib/services/chatbotBookingService";
import { updateBookingStatusSchema } from "@/lib/validation/chatbot-booking";

/**
 * GET /api/chatbots/[id]/bookings/[bookingId] - Get a single booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bookingId: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, bookingId } = await params;

    const booking = await chatbotBookingService.getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.chatbotId !== id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.chatbot.organizationId !== session.organization.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: booking });
  } catch (error) {
    console.error("Error getting booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/chatbots/[id]/bookings/[bookingId] - Update booking status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bookingId: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, bookingId } = await params;

    const booking = await chatbotBookingService.getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.chatbotId !== id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.chatbot.organizationId !== session.organization.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = updateBookingStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.errors },
        { status: 400 },
      );
    }

    const updated = await chatbotBookingService.updateBookingStatus(
      bookingId,
      result.data.status,
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

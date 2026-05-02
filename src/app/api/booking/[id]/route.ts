import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import { requireSession } from "@/lib/guards";
import { BookingStatuses, UserRoles } from "@/lib/constants";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    const { id } = await params;
    const payload = await request.json().catch(() => ({}));
    await connectToDatabase();

    const booking = await Booking.findById(id);
    if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isOwner = booking.userId.toString() === session.user._id;
    const isManager = [UserRoles.ADMIN, UserRoles.ORGANIZER].includes(session.user.role);

    if (!isOwner && !isManager) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (payload.action === "cancel") {
        booking.status = BookingStatuses.CANCELLED;
        booking.cancellationReason = payload.reason ?? "Cancelled by user";
        await booking.save();
        return NextResponse.json({ booking, message: "Booking cancelled" });
    }

    if (payload.action === "confirm") {
        if (![UserRoles.ADMIN, UserRoles.ORGANIZER].includes(session.user.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const service = await Service.findById(booking.serviceId).lean();
        const isOwner = service && service.organizerId.toString() === session.user._id;
        if (session.user.role !== UserRoles.ADMIN && !isOwner) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        booking.status = BookingStatuses.CONFIRMED;
        await booking.save();
        return NextResponse.json({ booking, message: "Booking confirmed" });
    }

    if (payload.action === "reschedule") {
        const { date, time } = payload;
        if (!date || !time) {
            return NextResponse.json({ error: "date and time are required" }, { status: 400 });
        }

        const conflict = await Booking.findOne({
            _id: { $ne: booking._id },
            providerId: booking.providerId,
            date,
            time,
            status: { $in: [BookingStatuses.PENDING, BookingStatuses.CONFIRMED, BookingStatuses.RESCHEDULED] },
        });

        if (conflict) {
            return NextResponse.json({ error: "Selected slot is no longer available" }, { status: 409 });
        }

        const service = await Service.findById(booking.serviceId);
        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }

        if (service.requiresPayment && booking.paymentStatus !== "paid") {
            booking.paymentStatus = "pending";
        }

        booking.date = date;
        booking.time = time;
        booking.status = BookingStatuses.CONFIRMED;
        await booking.save();
        return NextResponse.json({ booking, message: "Booking rescheduled" });
    }

    if (payload.action === "pay") {
        // Allow booking owner to mark booking as paid and confirm it
        if (!isOwner) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // mark paid and confirm regardless of autoConfirm (hard-coded flow)
        booking.paymentStatus = "paid";
        booking.status = BookingStatuses.CONFIRMED;
        await booking.save();
        return NextResponse.json({ booking, message: "Payment successful and booking confirmed" });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    const { id } = await params;
    await connectToDatabase();

    const booking = await Booking.findById(id).populate("serviceId providerId userId").lean();
    if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isOwner = booking.userId && booking.userId._id ? booking.userId._id.toString() === session.user._id : booking.userId.toString() === session.user._id;
    const isManager = [UserRoles.ADMIN, UserRoles.ORGANIZER].includes(session.user.role);

    if (!isOwner && !isManager) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ booking });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    await connectToDatabase();

    const booking = await Booking.findById(id);
    if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isOwner = booking.userId.toString() === session.user._id;
    const isManager = [UserRoles.ADMIN, UserRoles.ORGANIZER].includes(session.user.role);

    if (!isOwner && !isManager) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    booking.status = BookingStatuses.CANCELLED;
    booking.cancellationReason = body.reason ?? "Cancelled";
    await booking.save();

    return NextResponse.json({ booking, message: "Booking cancelled" });
}

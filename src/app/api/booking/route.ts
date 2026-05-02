import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { bookingSchema } from "@/lib/validation";
import { requireSession, requireRole } from "@/lib/guards";
import { UserRoles, BookingStatuses } from "@/lib/constants";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import { sendBookingConfirmationEmail } from "@/lib/mail";

export async function GET() {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    await connectToDatabase();
    let filter;

    if (session.user.role === UserRoles.CUSTOMER) {
        // Customers see their own bookings
        filter = { userId: session.user._id };
    } else if (session.user.role === UserRoles.ORGANIZER) {
        // Organizers see bookings for their services and bookings where they are provider
        const services = await Service.find({ organizerId: session.user._id }).select('_id').lean();
        const serviceIds = services.map(s => s._id);
        filter = {
            $or: [
                { providerId: session.user._id },
                { serviceId: { $in: serviceIds } }
            ]
        };
    } else if (session.user.role === UserRoles.ADMIN) {
        // Admins see all bookings
        filter = {};
    } else {
        filter = { userId: session.user._id };
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 }).populate("serviceId providerId userId").lean();
    return NextResponse.json({ bookings });
}

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    const forbidden = requireRole(session.user, [UserRoles.CUSTOMER, UserRoles.ORGANIZER, UserRoles.ADMIN]);
    if (forbidden) {
        return forbidden;
    }

    try {
        const payload = bookingSchema.parse(await request.json());
        await connectToDatabase();

        const service = await Service.findById(payload.serviceId);
        if (!service || !service.isPublished) {
            return NextResponse.json({ error: "Service not available" }, { status: 404 });
        }

        const providerAllowed =
            service.organizerId.toString() === payload.providerId ||
            service.providerIds?.some((providerId: { toString: () => string } | string) => providerId.toString() === payload.providerId);

        if (!providerAllowed) {
            return NextResponse.json({ error: "Provider is not assigned to this service" }, { status: 400 });
        }

        const existing = await Booking.findOne({
            providerId: payload.providerId,
            date: payload.date,
            time: payload.time,
            status: { $in: [BookingStatuses.PENDING, BookingStatuses.CONFIRMED, BookingStatuses.RESCHEDULED] },
        });

        if (existing) {
            return NextResponse.json({ error: "Selected slot is no longer available" }, { status: 409 });
        }

        if (payload.numberOfPeople > service.capacity) {
            return NextResponse.json({ error: "Capacity exceeded" }, { status: 400 });
        }

        const booking = await Booking.create({
            userId: session.user._id,
            serviceId: payload.serviceId,
            providerId: payload.providerId,
            date: payload.date,
            time: payload.time,
            status: service.autoConfirm ? BookingStatuses.CONFIRMED : BookingStatuses.PENDING,
            numberOfPeople: payload.numberOfPeople,
            answers: payload.answers,
            customerName: payload.name,
            customerEmail: payload.email,
            customerPhone: payload.phone,
            paymentStatus: service.requiresPayment ? "pending" : "not-required",
        });

        const providerName = service.organizerId.toString() === payload.providerId ? "Service Provider" : "Assigned Provider";
        await sendBookingConfirmationEmail(payload.email, {
            serviceName: service.name,
            date: payload.date,
            time: payload.time,
            providerName,
            status: booking.status,
        });

        return NextResponse.json({ booking }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create booking";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

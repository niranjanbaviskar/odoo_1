import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Booking from "@/models/Booking";
import { requireSession, requireRole } from "@/lib/guards";
import { UserRoles } from "@/lib/constants";

export async function GET() {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    const forbidden = requireRole(session.user, [UserRoles.ADMIN]);
    if (forbidden) {
        return forbidden;
    }

    await connectToDatabase();
    const [totalUsers, totalProviders, totalAppointments, upcoming] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: UserRoles.ORGANIZER }),
        Booking.countDocuments(),
        Booking.countDocuments({ status: { $in: ["pending", "confirmed", "rescheduled"] } }),
    ]);

    return NextResponse.json({
        metrics: { totalUsers, totalProviders, totalAppointments, upcoming },
    });
}

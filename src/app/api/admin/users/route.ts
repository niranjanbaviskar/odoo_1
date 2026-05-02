import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import { adminUserUpdateSchema } from "@/lib/validation";
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
    const users = await User.find().select("name email role isVerified isActive phone timezone createdAt").sort({ createdAt: -1 }).lean();
    return NextResponse.json({ users });
}

export async function PATCH(request: NextRequest) {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    const forbidden = requireRole(session.user, [UserRoles.ADMIN]);
    if (forbidden) {
        return forbidden;
    }

    try {
        const payload = adminUserUpdateSchema.parse(await request.json());
        await connectToDatabase();
        const user = await User.findByIdAndUpdate(payload.userId, { ...(payload.role ? { role: payload.role } : {}), ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}) }, { new: true });
        return NextResponse.json({ user });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update user";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function DELETE(request: NextRequest) {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    const forbidden = requireRole(session.user, [UserRoles.ADMIN]);
    if (forbidden) {
        return forbidden;
    }

    try {
        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        if (userId === session.user._id) {
            return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
        }

        await connectToDatabase();
        const targetUser = await User.findById(userId);

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (targetUser.role === UserRoles.ORGANIZER) {
            const services = await Service.find({ organizerId: targetUser._id }).select("_id").lean();
            const serviceIds = services.map((service) => service._id);

            await Booking.deleteMany({ $or: [{ serviceId: { $in: serviceIds } }, { providerId: targetUser._id }, { userId: targetUser._id }] });
            await Service.deleteMany({ organizerId: targetUser._id });
        } else {
            await Booking.deleteMany({ userId: targetUser._id });
        }

        await User.findByIdAndDelete(targetUser._id);

        return NextResponse.json({ message: "User deleted permanently" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete user";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

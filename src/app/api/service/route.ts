import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { serviceSchema } from "@/lib/validation";
import { requireSession, requireRole } from "@/lib/guards";
import { UserRoles } from "@/lib/constants";

export async function GET(request: NextRequest) {
    await connectToDatabase();
    const session = await requireSession();
    const searchParams = request.nextUrl.searchParams;
    const mine = searchParams.get("mine") === "true";

    if (session.user && mine) {
        const filter = session.user.role === UserRoles.ADMIN ? {} : { organizerId: session.user._id };
        const services = await Service.find(filter).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ services });
    }

    const services = await Service.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ services });
}

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    const forbidden = requireRole(session.user, [UserRoles.ORGANIZER, UserRoles.ADMIN]);
    if (forbidden) {
        return forbidden;
    }

    try {
        const payload = serviceSchema.parse(await request.json());
        await connectToDatabase();

        const service = await Service.create({
            ...payload,
            organizerId: session.user.role === UserRoles.ADMIN && payload.organizerId ? payload.organizerId : session.user._id,
            providerIds: payload.providerIds.length ? payload.providerIds : [session.user._id],
        });

        return NextResponse.json({ service }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create service";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

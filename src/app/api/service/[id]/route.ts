import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { serviceSchema } from "@/lib/validation";
import { requireSession, requireRole } from "@/lib/guards";
import { UserRoles } from "@/lib/constants";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await connectToDatabase();
    const { id } = await params;
    const service = await Service.findById(id).lean();

    if (!service) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const session = await requireSession();
    if (!service.isPublished && (!session.user || ![UserRoles.ADMIN, UserRoles.ORGANIZER].includes(session.user.role) || session.user._id !== service.organizerId?.toString())) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ service });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    const { id } = await params;
    const existing = await Service.findById(id);

    if (!existing) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const isOwner = existing.organizerId.toString() === session.user._id;
    const forbidden = requireRole(session.user, [UserRoles.ADMIN, UserRoles.ORGANIZER]);
    if (forbidden || (!isOwner && session.user.role !== UserRoles.ADMIN)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const payload = serviceSchema.partial().parse(await request.json());
        const service = await Service.findByIdAndUpdate(id, payload, { new: true });
        return NextResponse.json({ service });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update service";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    const { id } = await params;
    const service = await Service.findById(id);

    if (!service) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (session.user.role !== UserRoles.ADMIN && service.organizerId.toString() !== session.user._id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Service.findByIdAndUpdate(id, { isPublished: false });
    return NextResponse.json({ message: "Service unpublished" });
}

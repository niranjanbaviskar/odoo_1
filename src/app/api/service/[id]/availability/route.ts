import { NextResponse, type NextRequest } from "next/server";
import { getServiceAvailability } from "@/lib/availability";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const date = request.nextUrl.searchParams.get("date");

    if (!date) {
        return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    const result = await getServiceAvailability(id, date);

    if (!result) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(result);
}

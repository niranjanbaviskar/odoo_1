import { NextResponse } from "next/server";
import { requireSession } from "@/lib/guards";

export async function GET() {
    const session = await requireSession();

    if (session.response) {
        return session.response;
    }

    return NextResponse.json({ user: session.user });
}

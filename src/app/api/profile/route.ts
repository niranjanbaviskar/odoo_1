import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { profileSchema } from "@/lib/validation";
import { requireSession } from "@/lib/guards";

export async function GET() {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    return NextResponse.json({ user: session.user });
}

export async function PATCH(request: NextRequest) {
    const session = await requireSession();
    if (session.response) {
        return session.response;
    }

    try {
        const payload = profileSchema.parse(await request.json());
        await connectToDatabase();
        const user = await User.findByIdAndUpdate(session.user._id, payload, { new: true }).select("name email role isVerified isActive phone timezone");
        return NextResponse.json({ user });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update profile";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

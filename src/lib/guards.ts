import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifySessionToken } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function requireSession() {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    try {
        const payload = verifySessionToken(token);
        await connectToDatabase();
        const user = await User.findById(payload.userId).select("name email role isVerified isActive phone timezone").lean();

        if (!user || !user.isActive) {
            return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
        }

        return {
            user: { ...user, _id: user._id.toString() },
            response: null,
        };
    } catch {
        return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
}

export function requireRole(user: { role: string } | null, roles: string[]) {
    if (!user || !roles.includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return null;
}

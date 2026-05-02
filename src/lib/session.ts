import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifySessionToken } from "@/lib/auth";
import User from "@/models/User";

export async function getSessionUser() {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    try {
        const payload = verifySessionToken(token);
        await connectToDatabase();
        const user = await User.findById(payload.userId).select("name email role isVerified isActive phone timezone").lean();

        if (!user || !user.isActive) {
            return null;
        }

        return {
            ...user,
            _id: user._id.toString(),
        };
    } catch {
        return null;
    }
}

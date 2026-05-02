import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { loginSchema } from "@/lib/validation";
import { comparePassword, signSessionToken } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export async function POST(request: NextRequest) {
    try {
        const payload = loginSchema.parse(await request.json());
        await connectToDatabase();
        const user = await User.findOne({ email: payload.email.toLowerCase() });

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
        }

        const passwordMatches = await comparePassword(payload.password, user.password);

        if (!passwordMatches) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
        }

        if (!user.isVerified) {
            return NextResponse.json({ error: "Please verify your email first" }, { status: 403 });
        }

        const response = NextResponse.json({
            message: "Logged in successfully",
            user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
        });

        response.cookies.set(SESSION_COOKIE_NAME, signSessionToken({ userId: user._id.toString(), email: user.email, role: user.role }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Login failed";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

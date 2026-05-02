import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { otpSchema } from "@/lib/validation";
import { verifyOtp, OtpPurposes } from "@/lib/otp";
import { signSessionToken } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export async function POST(request: NextRequest) {
    try {
        const payload = otpSchema.parse(await request.json());
        const result = await verifyOtp(payload.email.toLowerCase(), OtpPurposes.VERIFY_EMAIL, payload.otp);

        if (!result.valid) {
            return NextResponse.json({ error: result.reason }, { status: 400 });
        }

        await connectToDatabase();
        const user = await User.findOneAndUpdate(
            { email: payload.email.toLowerCase() },
            { isVerified: true },
            { new: true },
        );

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const response = NextResponse.json({ message: "Email verified", userId: user._id.toString() });
        response.cookies.set(SESSION_COOKIE_NAME, signSessionToken({ userId: user._id.toString(), email: user.email, role: user.role }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        const message = error instanceof Error ? error.message : "OTP verification failed";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

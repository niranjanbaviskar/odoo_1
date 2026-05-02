import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { signupSchema } from "@/lib/validation";
import { hashPassword, signSessionToken } from "@/lib/auth";
import { createOtpRecord, OtpPurposes } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mail";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export async function POST(request: NextRequest) {
    try {
        const payload = signupSchema.parse(await request.json());
        await connectToDatabase();

        const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
        const password = await hashPassword(payload.password);

        const user = existingUser
            ? await User.findByIdAndUpdate(
                existingUser._id,
                {
                    name: payload.name,
                    password,
                    role: payload.role,
                    isVerified: false,
                    isActive: true,
                },
                { new: true },
            )
            : await User.create({
                name: payload.name,
                email: payload.email.toLowerCase(),
                password,
                role: payload.role,
                isVerified: false,
                isActive: true,
            });

        const { otp } = await createOtpRecord(payload.email.toLowerCase(), OtpPurposes.VERIFY_EMAIL);
        await sendOtpEmail(payload.email.toLowerCase(), otp, OtpPurposes.VERIFY_EMAIL);

        const response = NextResponse.json({
            message: "Account created. Check your email for the verification OTP.",
            requiresVerification: true,
            userId: user?._id.toString(),
        });

        response.cookies.set(SESSION_COOKIE_NAME, signSessionToken({ userId: user!._id.toString(), email: user!.email, role: user!.role }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create account";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

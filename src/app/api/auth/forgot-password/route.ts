import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validation";
import { createOtpRecord, OtpPurposes } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mail";

export async function POST(request: NextRequest) {
    try {
        const payload = forgotPasswordSchema.parse(await request.json());
        await connectToDatabase();
        const user = await User.findOne({ email: payload.email.toLowerCase() });

        if (!user) {
            return NextResponse.json({ message: "If the account exists, a reset OTP has been sent." });
        }

        const { otp } = await createOtpRecord(payload.email.toLowerCase(), OtpPurposes.RESET_PASSWORD);
        await sendOtpEmail(payload.email.toLowerCase(), otp, OtpPurposes.RESET_PASSWORD);

        return NextResponse.json({ message: "Reset OTP sent to your email" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send reset OTP";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

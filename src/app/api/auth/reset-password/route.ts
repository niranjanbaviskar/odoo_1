import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { resetPasswordSchema } from "@/lib/validation";
import { verifyOtp, OtpPurposes } from "@/lib/otp";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const payload = resetPasswordSchema.parse(await request.json());
        const result = await verifyOtp(payload.email.toLowerCase(), OtpPurposes.RESET_PASSWORD, payload.otp);

        if (!result.valid) {
            return NextResponse.json({ error: result.reason }, { status: 400 });
        }

        await connectToDatabase();
        const password = await hashPassword(payload.password);
        const user = await User.findOneAndUpdate(
            { email: payload.email.toLowerCase() },
            { password, isVerified: true },
            { new: true },
        );

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Password updated successfully" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Reset failed";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

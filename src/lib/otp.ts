import { randomInt } from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import { OtpPurposes, type OtpPurpose } from "@/lib/constants";
import Otp from "@/models/Otp";

export function generateOtp() {
    return `${randomInt(100000, 999999)}`;
}

export async function createOtpRecord(email: string, purpose: OtpPurpose) {
    await connectToDatabase();
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.findOneAndUpdate(
        { email, purpose },
        { otp, expiresAt, purpose, attempts: 0 },
        { upsert: true, new: true },
    );

    return { otp, expiresAt };
}

export async function verifyOtp(email: string, purpose: OtpPurpose, otp: string) {
    await connectToDatabase();
    const record = await Otp.findOne({ email, purpose });

    if (!record) {
        return { valid: false, reason: "OTP not found" as const };
    }

    if (record.expiresAt.getTime() < Date.now()) {
        return { valid: false, reason: "OTP expired" as const };
    }

    if (record.otp !== otp) {
        await Otp.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
        return { valid: false, reason: "Invalid OTP" as const };
    }

    await Otp.deleteOne({ _id: record._id });
    return { valid: true as const };
}

export { OtpPurposes };

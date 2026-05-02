import { Schema, model, models, type InferSchemaType } from "mongoose";

const otpSchema = new Schema(
    {
        email: { type: String, required: true, lowercase: true, index: true },
        otp: { type: String, required: true },
        purpose: { type: String, required: true, index: true },
        expiresAt: { type: Date, required: true, index: true },
        attempts: { type: Number, default: 0 },
    },
    { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OtpDocument = InferSchemaType<typeof otpSchema> & { _id: string };

const Otp = models.Otp || model("Otp", otpSchema);

export default Otp;

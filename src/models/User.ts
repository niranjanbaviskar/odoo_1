import { Schema, model, models, type InferSchemaType } from "mongoose";
import { UserRoles } from "@/lib/constants";

const userSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, index: true },
        password: { type: String, required: true },
        role: { type: String, enum: Object.values(UserRoles), default: UserRoles.CUSTOMER, index: true },
        isVerified: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        phone: { type: String, default: "" },
        timezone: { type: String, default: "UTC" },
        avatar: { type: String, default: "" },
    },
    { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: string };

const User = models.User || model("User", userSchema);

export default User;

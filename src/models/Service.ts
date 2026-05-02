import { Schema, model, models, type InferSchemaType } from "mongoose";

const serviceSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, index: true },
        description: { type: String, required: true },
        duration: { type: Number, required: true },
        organizerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        providerIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
        capacity: { type: Number, default: 1 },
        venue: { type: String, default: "Online" },
        isPublished: { type: Boolean, default: false, index: true },
        requiresPayment: { type: Boolean, default: false },
        autoConfirm: { type: Boolean, default: true },
        assignmentMode: { type: String, enum: ["auto", "manual"], default: "auto" },
        customQuestions: [
            {
                label: String,
                type: { type: String, enum: ["text", "textarea", "email", "phone", "select"] },
                required: { type: Boolean, default: false },
                options: [String],
                placeholder: String,
            },
        ],
        schedule: {
            timezone: { type: String, default: "UTC" },
            slotInterval: { type: Number, default: 15 },
            bufferMinutes: { type: Number, default: 0 },
            workingDays: [
                {
                    day: Number,
                    active: Boolean,
                    windows: [
                        {
                            start: String,
                            end: String,
                            breaks: [
                                {
                                    start: String,
                                    end: String,
                                },
                            ],
                        },
                    ],
                },
            ],
            overrides: [
                {
                    date: String,
                    blocked: Boolean,
                    windows: [
                        {
                            start: String,
                            end: String,
                            breaks: [
                                {
                                    start: String,
                                    end: String,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
    { timestamps: true },
);

export type ServiceDocument = InferSchemaType<typeof serviceSchema> & { _id: string };

const Service = models.Service || model("Service", serviceSchema);

export default Service;

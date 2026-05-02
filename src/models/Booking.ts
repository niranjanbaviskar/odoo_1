import { Schema, model, models, type InferSchemaType } from "mongoose";
import { BookingStatuses } from "@/lib/constants";

const bookingSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true, index: true },
        providerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        date: { type: String, required: true, index: true },
        time: { type: String, required: true, index: true },
        status: { type: String, enum: Object.values(BookingStatuses), default: BookingStatuses.PENDING, index: true },
        numberOfPeople: { type: Number, default: 1 },
        answers: [
            {
                question: String,
                answer: String,
            },
        ],
        customerName: { type: String, required: true },
        customerEmail: { type: String, required: true, index: true },
        customerPhone: { type: String, required: true },
        notes: { type: String, default: "" },
        paymentStatus: { type: String, default: "not-required" },
        cancellationReason: { type: String, default: "" },
    },
    { timestamps: true },
);

bookingSchema.index(
    { providerId: 1, date: 1, time: 1 },
    { unique: true, partialFilterExpression: { status: { $in: [BookingStatuses.PENDING, BookingStatuses.CONFIRMED, BookingStatuses.RESCHEDULED] } } },
);

export type BookingDocument = InferSchemaType<typeof bookingSchema> & { _id: string };

const Booking = models.Booking || model("Booking", bookingSchema);

export default Booking;

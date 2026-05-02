import { z } from "zod";
import { UserRoles } from "@/lib/constants";

const customQuestionSchema = z.object({
    label: z.string().min(1),
    type: z.enum(["text", "textarea", "email", "phone", "select"]),
    required: z.boolean().default(false),
    options: z.array(z.string()).default([]),
    placeholder: z.string().optional(),
});

export const signupSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum([UserRoles.CUSTOMER, UserRoles.ORGANIZER, UserRoles.ADMIN]).default(UserRoles.CUSTOMER),
});

export const otpSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

export const resetPasswordSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    password: z.string().min(8),
});

export const serviceSchema = z.object({
    name: z.string().min(2),
    description: z.string().min(10),
    duration: z.number().int().min(15).max(240),
    organizerId: z.string().optional(),
    providerIds: z.array(z.string()).default([]),
    capacity: z.number().int().min(1).max(100).default(1),
    venue: z.string().default("Online"),
    isPublished: z.boolean().default(false),
    requiresPayment: z.boolean().default(false),
    autoConfirm: z.boolean().default(true),
    assignmentMode: z.enum(["auto", "manual"]).default("auto"),
    customQuestions: z.array(customQuestionSchema).default([]),
    schedule: z.object({
        timezone: z.string().default("UTC"),
        slotInterval: z.number().int().min(5).max(120).default(15),
        bufferMinutes: z.number().int().min(0).max(120).default(0),
        workingDays: z.array(
            z.object({
                day: z.number().int().min(0).max(6),
                active: z.boolean().default(true),
                windows: z.array(
                    z.object({
                        start: z.string(),
                        end: z.string(),
                        breaks: z
                            .array(
                                z.object({
                                    start: z.string(),
                                    end: z.string(),
                                }),
                            )
                            .default([]),
                    }),
                ),
            }),
        ).default([]),
        overrides: z.array(
            z.object({
                date: z.string(),
                blocked: z.boolean().default(false),
                windows: z
                    .array(
                        z.object({
                            start: z.string(),
                            end: z.string(),
                            breaks: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
                        }),
                    )
                    .default([]),
            }),
        ).default([]),
    }),
});

export const bookingSchema = z.object({
    serviceId: z.string(),
    providerId: z.string(),
    date: z.string(),
    time: z.string(),
    numberOfPeople: z.number().int().min(1).default(1),
    answers: z.array(
        z.object({
            question: z.string(),
            answer: z.string(),
        }),
    ).default([]),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6),
});

export const rescheduleSchema = z.object({
    bookingId: z.string(),
    date: z.string(),
    time: z.string(),
});

export const cancelSchema = z.object({
    bookingId: z.string(),
    reason: z.string().optional(),
});

export const profileSchema = z.object({
    name: z.string().min(2),
    phone: z.string().optional(),
    timezone: z.string().optional(),
});

export const adminUserUpdateSchema = z.object({
    userId: z.string(),
    role: z.enum([UserRoles.CUSTOMER, UserRoles.ORGANIZER, UserRoles.ADMIN]).optional(),
    isActive: z.boolean().optional(),
});

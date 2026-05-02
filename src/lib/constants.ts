export const SESSION_COOKIE_NAME = "appointment_booking_session";

export const UserRoles = {
    CUSTOMER: "customer",
    ORGANIZER: "organizer",
    ADMIN: "admin",
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export const BookingStatuses = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
    RESCHEDULED: "rescheduled",
    COMPLETED: "completed",
} as const;

export type BookingStatus = (typeof BookingStatuses)[keyof typeof BookingStatuses];

export const OtpPurposes = {
    VERIFY_EMAIL: "verify-email",
    RESET_PASSWORD: "reset-password",
} as const;

export type OtpPurpose = (typeof OtpPurposes)[keyof typeof OtpPurposes];

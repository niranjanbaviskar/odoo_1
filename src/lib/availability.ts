import { format, parseISO } from "date-fns";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/db";
import { generateAvailability, type ServiceSchedule } from "@/lib/schedule";

type ProviderRef = { _id: { toString: () => string } } | { _id: string } | string;

export async function getServiceAvailability(serviceId: string, date: string) {
    await connectToDatabase();
    const service = await Service.findById(serviceId).populate("providerIds", "name email role").lean();

    if (!service) {
        return null;
    }

    const bookingDate = parseISO(date);
    const providerIds = (service.providerIds?.length ? (service.providerIds as ProviderRef[]) : [service.organizerId as ProviderRef]).map((provider) => {
        if (typeof provider === "string") {
            return provider;
        }

        return provider._id.toString();
    });
    const bookings = await Booking.find({
        serviceId,
        providerId: { $in: providerIds },
        date: format(bookingDate, "yyyy-MM-dd"),
        status: { $in: ["pending", "confirmed", "rescheduled"] },
    }).lean();

    const providers = await User.find({ _id: { $in: providerIds } }).select("name email role").lean();
    const providerLookup = new Map(providers.map((provider) => [provider._id.toString(), provider]));
    const schedule = service.schedule as ServiceSchedule;

    const providerSlots = providerIds.map((providerId) => {
        const providerBookings = bookings.filter((booking) => booking.providerId.toString() === providerId);
        const unavailableTimes = providerBookings.map((booking) => booking.time);
        const provider = providerLookup.get(providerId);
        const slots = generateAvailability({
            date: bookingDate,
            schedule,
            durationMinutes: service.duration,
            existingTimes: unavailableTimes,
        });

        return {
            providerId,
            providerName: provider?.name ?? "Provider",
            slots: slots.map((time) => ({
                time,
                label: format(new Date(`${date}T${time}:00`), "hh:mm a"),
                isAvailable: true,
            })),
        };
    });

    return { service, providerSlots };
}

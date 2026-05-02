import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { ProfileForm } from "@/components/forms/profile-form";
import { connectToDatabase } from "@/lib/db";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import { ServiceCardActions } from "@/components/services/ServiceCardActions";
import { BookingCardActions } from "@/components/booking/BookingCardActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    await connectToDatabase();
    const user = await getSessionUser();
    if (!user) {
        redirect("/auth/login");
    }

    let services: any[] = [];
    let bookings: any[] = [];

    if (user.role === "organizer") {
        // Show organizer's services and all bookings for those services
        services = await Service.find({ organizerId: user._id }).sort({ createdAt: -1 }).lean();
        const serviceIds = services.map((s: any) => s._id);
        bookings = await Booking.find({
            $or: [
                { userId: user._id },
                { serviceId: { $in: serviceIds } },
                { providerId: user._id }
            ]
        }).sort({ createdAt: -1 }).limit(10).populate("serviceId").lean();
    } else {
        // Customers see their own bookings
        bookings = await Booking.find({ userId: user._id }).sort({ createdAt: -1 }).limit(6).populate("serviceId").lean();
    }

    return (
        <main className="px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <ProfileForm />
                    {user.role === "organizer" && (
                        <Card className="border-white/10 bg-white/5">
                            <CardHeader>
                                <CardTitle>Your services</CardTitle>
                                <CardDescription>Services you've created and manage</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {services.length === 0 ? (
                                    <div className="text-sm text-slate-400">No services created yet. Go to Dashboard to create one.</div>
                                ) : (
                                    services.map((service: any) => (
                                        <div key={service._id.toString()} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="font-medium text-white">{service.name}</div>
                                                    <div className="mt-1 text-sm text-slate-400">{service.description}</div>
                                                    <div className="mt-2 flex gap-2">
                                                        <Badge variant={service.isPublished ? "success" : "warning"}>
                                                            {service.isPublished ? "Published" : "Draft"}
                                                        </Badge>
                                                        <span className="text-xs text-slate-500">{service.duration} min</span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <small className="text-xs text-slate-400">Providers: {service.providerIds?.length ?? 0}</small>
                                                    </div>
                                                    <div className="mt-2">
                                                        <ServiceCardActions
                                                            service={{
                                                                _id: service._id.toString(),
                                                                name: service.name,
                                                                description: service.description,
                                                                duration: service.duration,
                                                                capacity: service.capacity,
                                                                venue: service.venue,
                                                                isPublished: service.isPublished,
                                                                autoConfirm: service.autoConfirm,
                                                                requiresPayment: service.requiresPayment,
                                                                assignmentMode: service.assignmentMode,
                                                                providerIds: (service.providerIds ?? []).map((providerId: any) => providerId.toString()),
                                                                schedule: service.schedule,
                                                                customQuestions: service.customQuestions,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle>
                            {user.role === "organizer" ? "Service bookings & your appointments" : "Your appointments"}
                        </CardTitle>
                        <CardDescription>
                            {user.role === "organizer"
                                ? "All bookings for your services plus your personal appointments"
                                : "A quick snapshot of your booking history"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {bookings.length === 0 ? (
                            <div className="text-sm text-slate-400">No appointments yet</div>
                        ) : (
                            bookings.map((booking: any) => (
                                <div key={booking._id.toString()} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="font-medium text-white">{booking.date} • {booking.time}</div>
                                            {booking.serviceId?.name && (
                                                <div className="mt-1 text-sm text-slate-400">Service: {booking.serviceId.name}</div>
                                            )}
                                            <div className="mt-1 text-sm text-slate-400">Customer: {booking.customerName}</div>
                                            <div className="mt-2 text-xs text-slate-500">People: {booking.numberOfPeople}</div>
                                            <div className="mt-2">
                                                <BookingCardActions
                                                    bookingId={booking._id.toString()}
                                                    canConfirm={user.role !== "customer" && booking.status === "pending" && booking.serviceId?.autoConfirm === false}
                                                />
                                            </div>
                                        </div>
                                        <Badge variant={booking.status === "confirmed" ? "success" : booking.status === "cancelled" ? "danger" : "warning"}>{booking.status}</Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

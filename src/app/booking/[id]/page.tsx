import { notFound, redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import User from "@/models/User";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingActions } from "@/components/booking/booking-actions";
import { dateLabel } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export default async function BookingConfirmationPage({ params }: { params: { id: string } }) {
    await connectToDatabase();
    const user = await getSessionUser();
    if (!user) {
        redirect("/auth/login");
    }

    const booking = await Booking.findById(params.id).lean();
    if (!booking) {
        notFound();
    }

    if (booking.userId.toString() !== user._id && user.role !== "admin" && user.role !== "organizer") {
        redirect("/booking");
    }

    const [service, provider] = await Promise.all([
        Service.findById(booking.serviceId).lean(),
        User.findById(booking.providerId).lean(),
    ]);

    if (!service) {
        notFound();
    }

    return (
        <main className="px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <Badge variant="success">{booking.status}</Badge>
                        <CardTitle className="text-3xl">Appointment confirmed</CardTitle>
                        <CardDescription>Your appointment summary is ready. You can cancel or reschedule from here.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="text-slate-400">Date</div><div className="text-lg text-white">{booking.date}</div></div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="text-slate-400">Time</div><div className="text-lg text-white">{dateLabel(booking.date, booking.time)}</div></div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="text-slate-400">Provider</div><div className="text-lg text-white">{provider?.name ?? "Provider"}</div></div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="text-slate-400">Duration</div><div className="text-lg text-white">{service.duration} minutes</div></div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="text-slate-400">Status</div><div className="text-lg text-white">{booking.status}</div></div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="text-slate-400">Venue</div><div className="text-lg text-white">{service.venue}</div></div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:col-span-2"><div className="text-slate-400">Confirmation</div><div className="text-lg text-white">Your slot is reserved and the provider has been notified.</div></div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle>{service.name}</CardTitle>
                            <CardDescription>{service.description}</CardDescription>
                        </CardHeader>
                    </Card>
                    <BookingActions bookingId={booking._id.toString()} />
                </div>
            </div>
        </main>
    );
}

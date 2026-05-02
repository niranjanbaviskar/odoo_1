import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceForm } from "@/components/forms/service-form";
import { BookingCardActions } from "@/components/booking/BookingCardActions";
import { ServicesOverviewPanel } from "@/components/dashboard/services-overview-panel";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    await connectToDatabase();
    const user = await getSessionUser();
    if (!user) {
        redirect("/auth/login");
    }

    if (user.role === "admin") {
        redirect("/admin");
    }

    let services: any[] = [];
    let bookings: any[] = [];

    if (user.role === "customer") {
        // Customers see their own bookings
        bookings = await Booking.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10).populate("serviceId providerId").lean();
    } else if (user.role === "organizer") {
        // Organizers see their services and all bookings for those services
        services = await Service.find({ organizerId: user._id }).sort({ createdAt: -1 }).lean();
        const serviceIds = services.map((s: any) => s._id);
        bookings = await Booking.find({
            $or: [
                { providerId: user._id },
                { serviceId: { $in: serviceIds } }
            ]
        }).sort({ createdAt: -1 }).limit(10).populate("serviceId providerId").lean();
    } else if (user.role === "admin") {
        // Admins see all services and bookings
        services = await Service.find({}).sort({ createdAt: -1 }).lean();
        bookings = await Booking.find({}).sort({ createdAt: -1 }).limit(10).populate("serviceId providerId").lean();
    }

    return (
        <main className="px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <Badge variant="accent">{user.role}</Badge>
                        <CardTitle className="text-3xl">Dashboard</CardTitle>
                        <CardDescription>Monitor appointments, manage services, and keep availability clean.</CardDescription>
                    </CardHeader>
                </Card>

                <div className="grid gap-6 lg:grid-cols-3">
                    {user.role !== "customer" && (
                        <Card className="border-white/10 bg-white/5">
                            <CardContent className="pt-6">
                                <div className="text-sm text-slate-400">Services</div>
                                <div className="text-3xl font-semibold text-white">{services.length}</div>
                                <div className="mt-2 text-xs text-slate-400">Click below to view and edit the services you created.</div>
                            </CardContent>
                        </Card>
                    )}
                    <Card className="border-white/10 bg-white/5"><CardContent className="pt-6"><div className="text-sm text-slate-400">Bookings</div><div className="text-3xl font-semibold text-white">{bookings.length}</div></CardContent></Card>
                    <Card className="border-white/10 bg-white/5"><CardContent className="pt-6"><div className="text-sm text-slate-400">Profile</div><div className="text-3xl font-semibold text-white">{user.name}</div></CardContent></Card>
                </div>

                {user.role !== "customer" && (
                    <ServicesOverviewPanel
                        title={user.role === "admin" ? "All Services" : "Your Services"}
                        subtitle={user.role === "admin" ? "Click to inspect and edit services created across the system." : "Click to inspect and edit the services you created."}
                        services={services.map((service: any) => ({
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
                        }))}
                    />
                )}

                {user.role !== "customer" && <ServiceForm organizerId={user.role === "admin" ? undefined : user._id} />}

                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle>Recent bookings</CardTitle>
                        <CardDescription>Latest appointment activity for your account or managed services.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {bookings.length === 0 ? (
                            <div className="text-sm text-slate-400">No bookings yet</div>
                        ) : (
                            bookings.map((booking: any) => (
                                <div key={booking._id.toString()} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="font-medium text-white">{booking.date} • {booking.time}</div>
                                            <div className="mt-1 text-xs text-slate-400">
                                                {booking.serviceId?.name && `Service: ${booking.serviceId.name}`}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                Customer: {booking.customerName} ({booking.customerEmail})
                                            </div>
                                            {user.role !== "customer" && booking.status === "pending" && booking.serviceId?.autoConfirm === false && (
                                                <BookingCardActions bookingId={booking._id.toString()} canConfirm />
                                            )}
                                        </div>
                                        <Badge variant={booking.status === "confirmed" ? "success" : booking.status === "cancelled" ? "danger" : "warning"}>{booking.status}</Badge>
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500">People: {booking.numberOfPeople}</div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

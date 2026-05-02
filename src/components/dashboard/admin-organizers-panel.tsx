import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ServiceSummary = {
    _id: string;
    name: string;
    venue: string;
    duration: number;
    isPublished: boolean;
    autoConfirm: boolean;
    requiresPayment: boolean;
    bookingCount: number;
    customers: Array<{ name: string; email: string }>;
};

export type AdminOrganizerSummary = {
    _id: string;
    name: string;
    email: string;
    isVerified: boolean;
    isActive: boolean;
    serviceCount: number;
    bookingCount: number;
    services: ServiceSummary[];
};

export function AdminOrganizersPanel({ organizers }: { organizers: AdminOrganizerSummary[] }) {
    return (
        <Card className="border-white/10 bg-white/5">
            <CardHeader>
                <CardTitle>Organizers</CardTitle>
                <CardDescription>Registered service providers, their services, and the users who booked them.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {organizers.length === 0 ? (
                    <div className="text-sm text-slate-400">No organizers found.</div>
                ) : (
                    organizers.map((organizer) => (
                        <details key={organizer._id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                            <summary className="cursor-pointer list-none">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="text-lg font-semibold text-white">{organizer.name}</div>
                                        <div className="text-sm text-slate-400">{organizer.email}</div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="accent">{organizer.serviceCount} services</Badge>
                                        <Badge variant="accent">{organizer.bookingCount} bookings</Badge>
                                        <Badge variant={organizer.isVerified ? "success" : "warning"}>{organizer.isVerified ? "Verified" : "Pending verification"}</Badge>
                                    </div>
                                </div>
                            </summary>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {organizer.services.length === 0 ? (
                                    <div className="text-sm text-slate-400">No services created.</div>
                                ) : (
                                    organizer.services.map((service) => (
                                        <div key={service._id} className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="font-medium text-white">{service.name}</div>
                                                    <div className="text-xs text-slate-400">{service.venue}</div>
                                                </div>
                                                <Badge variant={service.isPublished ? "success" : "warning"}>{service.isPublished ? "Published" : "Draft"}</Badge>
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                <Badge variant="accent">{service.duration} min</Badge>
                                                <Badge variant={service.autoConfirm ? "success" : "warning"}>{service.autoConfirm ? "Auto confirm" : "Manual confirm"}</Badge>
                                                <Badge variant="accent">{service.bookingCount} bookings</Badge>
                                                <Badge variant="accent">{service.requiresPayment ? "Paid" : "Free"}</Badge>
                                            </div>

                                            <div className="mt-3 text-xs text-slate-400">
                                                {service.customers.length === 0 ? (
                                                    <span>No customers booked yet.</span>
                                                ) : (
                                                    <span>
                                                        Recent users: {service.customers.slice(0, 3).map((customer) => customer.name).join(", ")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </details>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

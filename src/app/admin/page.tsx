import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import User from "@/models/User";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import { AdminUsersTable } from "@/components/dashboard/admin-users-table";
import { AdminOrganizersPanel, type AdminOrganizerSummary } from "@/components/dashboard/admin-organizers-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    await connectToDatabase();
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
        redirect("/dashboard");
    }

    const [users, totalUsers, totalOrganizers, totalCustomers, totalAppointments] = await Promise.all([
        User.find().sort({ createdAt: -1 }).limit(50).lean(),
        User.countDocuments(),
        User.countDocuments({ role: "organizer" }),
        User.countDocuments({ role: "customer" }),
        Booking.countDocuments(),
    ]);

    const nonAdminUsers = users.filter((entry: any) => entry.role !== "admin");
    const adminUsers = users.filter((entry: any) => entry.role === "admin");

    const organizers = await User.find({ role: "organizer" }).sort({ createdAt: -1 }).lean();
    const organizersWithServices: AdminOrganizerSummary[] = await Promise.all(
        organizers.map(async (org: any) => {
            const services = await Service.find({ organizerId: org._id }).sort({ createdAt: -1 }).lean();
            const serviceIds = services.map((service) => service._id);
            const serviceBookings = serviceIds.length
                ? await Booking.find({ serviceId: { $in: serviceIds } }).sort({ createdAt: -1 }).populate("userId", "name email").lean()
                : [];

            const serviceSummaries = services.map((service: any) => {
                const relevantBookings = serviceBookings.filter((booking: any) => booking.serviceId?.toString() === service._id.toString());
                const customers = Array.from(
                    new Map(
                        relevantBookings.map((booking: any) => {
                            const bookingUser = booking.userId && typeof booking.userId === "object" ? booking.userId : null;
                            const name = bookingUser?.name ?? booking.customerName ?? "Unknown user";
                            const email = bookingUser?.email ?? booking.customerEmail ?? "";
                            return [email || name, { name, email }];
                        }),
                    ).values(),
                );

                return {
                    _id: service._id.toString(),
                    name: service.name,
                    venue: service.venue,
                    duration: service.duration,
                    isPublished: service.isPublished,
                    autoConfirm: service.autoConfirm,
                    requiresPayment: service.requiresPayment,
                    bookingCount: relevantBookings.length,
                    customers,
                };
            });

            return {
                _id: org._id.toString(),
                name: org.name,
                email: org.email,
                isVerified: org.isVerified,
                isActive: org.isActive,
                serviceCount: services.length,
                bookingCount: serviceBookings.length,
                services: serviceSummaries,
            };
        }),
    );

    return (
        <main className="px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-3xl">Admin Dashboard</CardTitle>
                                <CardDescription>Purpose: System-level monitoring and control</CardDescription>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                                <div className="font-medium text-white">{user.name}</div>
                                <div className="text-xs uppercase tracking-wide text-cyan-400">{user.role}</div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="border-white/10 bg-white/5"><CardContent className="pt-6"><div className="text-sm text-slate-400">Total users</div><div className="text-3xl font-semibold text-white">{totalUsers}</div></CardContent></Card>
                    <Card className="border-white/10 bg-white/5"><CardContent className="pt-6"><div className="text-sm text-slate-400">Total service providers</div><div className="text-3xl font-semibold text-white">{totalOrganizers}</div></CardContent></Card>
                    <Card className="border-white/10 bg-white/5"><CardContent className="pt-6"><div className="text-sm text-slate-400">Total appointments</div><div className="text-3xl font-semibold text-white">{totalAppointments}</div></CardContent></Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                    <AdminOrganizersPanel organizers={organizersWithServices} />

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>View all users, activate/deactivate accounts, change roles, and delete permanently.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                    <div className="text-sm text-slate-400">Registered users</div>
                                    <div className="mt-1 text-2xl font-semibold text-white">{users.length}</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                    <div className="text-sm text-slate-400">Customers</div>
                                    <div className="mt-1 text-2xl font-semibold text-white">{totalCustomers}</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                    <div className="text-sm text-slate-400">Organizers</div>
                                    <div className="mt-1 text-2xl font-semibold text-white">{totalOrganizers}</div>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                <div className="text-sm text-slate-400">Non-admin users</div>
                                <div className="mt-1 text-2xl font-semibold text-white">{nonAdminUsers.length}</div>
                                <div className="mt-2 text-xs text-slate-400">Customers and organizers are listed below in the management table.</div>
                            </div>

                            {adminUsers.length > 0 && (
                                <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                                    Admin accounts are present but separated from the customer/organizer list so they do not get lost in the general view.
                                </div>
                            )}

                            <div className="mt-4">
                                <AdminUsersTable currentUserId={user._id} users={users.map((entry: any) => ({ ...entry, _id: entry._id.toString() }))} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}

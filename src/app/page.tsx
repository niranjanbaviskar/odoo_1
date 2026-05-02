import Link from "next/link";
import { CalendarCheck2, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { ServiceCard } from "@/components/service-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
    await connectToDatabase();
    const services = await Service.find({ isPublished: true }).sort({ createdAt: -1 }).limit(6).lean();
    const [totalServices, totalBookings, totalOrganizers] = await Promise.all([
        Service.countDocuments({ isPublished: true }),
        Booking.countDocuments(),
        User.countDocuments({ role: "organizer" }),
    ]);

    return (
        <main className="space-y-16 px-4 py-10 sm:px-6 lg:px-8">
            <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                        <Sparkles className="h-4 w-4" />
                        Appointment booking, scheduling, and dashboards in one system
                    </div>
                    <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                        A dark, fast appointment platform for customers, organisers, and admins.
                    </h1>
                    <p className="max-w-2xl text-lg leading-8 text-slate-300">
                        PulseBook handles OTP onboarding, real-time slot availability, capacity checks, flexible schedules, booking confirmation, rescheduling, and system-wide reporting in a single Next.js app.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/booking" className="inline-flex h-12 items-center justify-center rounded-full bg-cyan-400 px-6 text-base font-medium text-slate-950 transition hover:bg-cyan-300">Book Appointment</Link>
                        <Link href="/auth/sign-up" className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 text-base font-medium text-white transition hover:bg-white/10">Create account</Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {[{ label: "Services", value: totalServices.toString(), icon: CalendarCheck2 }, { label: "Bookings", value: totalBookings.toString(), icon: Clock3 }, { label: "Providers", value: totalOrganizers.toString(), icon: ShieldCheck }].map((item) => (
                            <Card key={item.label} className="border-white/10 bg-white/5">
                                <CardContent className="flex items-center gap-4 pt-6">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                                        <item.icon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <div className="text-2xl font-semibold text-white">{item.value}</div>
                                        <div className="text-sm text-slate-400">{item.label}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Card className="overflow-hidden border-white/10 bg-white/5 p-0">
                    <CardHeader className="border-b border-white/10 p-6">
                        <CardTitle>How it works</CardTitle>
                        <CardDescription>Clean flow from service selection to confirmation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        {[
                            "Pick an appointment type and provider",
                            "Choose a date from the calendar",
                            "See real-time slots and capacity checks",
                            "Confirm, reschedule, or cancel later",
                        ].map((step, index) => (
                            <div key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">{index + 1}</span>
                                <span>{step}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            <section className="mx-auto max-w-7xl space-y-6">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-semibold text-white">Available services</h2>
                        <p className="mt-2 text-slate-400">Published appointment types available for instant booking.</p>
                    </div>
                    <Link href="/booking" className="hidden text-sm text-cyan-300 md:inline">View all</Link>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {services.map((service) => (
                        <ServiceCard key={service._id.toString()} service={{ ...service, _id: service._id.toString() }} />
                    ))}
                </div>
            </section>
        </main>
    );
}

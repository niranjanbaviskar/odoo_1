import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import Service from "@/models/Service";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function BookingPage({ searchParams }: { searchParams?: { service?: string } }) {
    await connectToDatabase();
    const user = await getSessionUser();
    if (!user) {
        redirect("/auth/login");
    }

    const services = await Service.find({ isPublished: true }).populate("providerIds", "name email role").sort({ createdAt: -1 }).lean();

    return (
        <main className="px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle className="text-3xl">Book your next appointment</CardTitle>
                        <CardDescription>Pick a service, choose a provider, and reserve a live slot in seconds.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-400">
                        Signed in as {user.name} • {user.email}
                    </CardContent>
                </Card>
                <BookingWizard services={services.map((service) => ({ ...service, _id: service._id.toString() }))} preselectedServiceId={searchParams?.service ?? ""} />
            </div>
        </main>
    );
}

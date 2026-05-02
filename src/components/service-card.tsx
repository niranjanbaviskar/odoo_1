import Link from "next/link";
import { ArrowRight, Clock3, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type ServiceCardData = {
    _id: string;
    name: string;
    description: string;
    duration: number;
    capacity: number;
    venue?: string;
    isPublished?: boolean;
    providerIds?: Array<{ _id?: string; name?: string } | string>;
};

export function ServiceCard({ service }: { service: ServiceCardData }) {
    return (
        <Card className="h-full border-white/10 bg-white/5 p-0 transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.07]">
            <CardHeader className="space-y-3 border-b border-white/10 p-6">
                <div className="flex items-center justify-between gap-3">
                    <Badge variant={service.isPublished ? "success" : "warning"}>{service.isPublished ? "Published" : "Draft"}</Badge>
                    <span className="text-xs text-slate-400">{service.providerIds?.length ?? 0} providers</span>
                </div>
                <CardTitle className="text-xl">{service.name}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-3 gap-3 text-sm text-slate-300">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                        <Clock3 className="mb-2 h-4 w-4 text-cyan-300" />
                        {service.duration} min
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                        <Users className="mb-2 h-4 w-4 text-cyan-300" />
                        Cap {service.capacity}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                        <MapPin className="mb-2 h-4 w-4 text-cyan-300" />
                        {service.venue ?? "Online"}
                    </div>
                </div>
                <Link href={`/booking?service=${service._id}`} className="inline-flex h-11 w-full items-center justify-center rounded-full bg-cyan-400 px-5 text-sm font-medium text-slate-950 transition hover:bg-cyan-300">
                    Book Appointment
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </CardContent>
        </Card>
    );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServiceCardActions } from "@/components/services/ServiceCardActions";

type ServiceSummary = {
    _id: string;
    name: string;
    description: string;
    duration: number;
    capacity: number;
    venue: string;
    isPublished: boolean;
    autoConfirm: boolean;
    requiresPayment: boolean;
    assignmentMode: string;
    providerIds?: string[];
    schedule?: {
        timezone?: string;
        slotInterval?: number;
        bufferMinutes?: number;
        workingDays?: unknown[];
        overrides?: unknown[];
    };
    customQuestions?: unknown[];
};

export function ServicesOverviewPanel({ services, title, subtitle }: { services: ServiceSummary[]; title: string; subtitle: string }) {
    const [open, setOpen] = useState(false);

    return (
        <Card className="border-white/10 bg-white/5">
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl">{title}</CardTitle>
                        <CardDescription>{subtitle}</CardDescription>
                    </div>
                    <Button variant="accent" onClick={() => setOpen((value) => !value)}>
                        {open ? "Hide services" : `Show services (${services.length})`}
                    </Button>
                </div>
            </CardHeader>
            {open && (
                <CardContent className="space-y-4">
                    {services.length === 0 ? (
                        <div className="text-sm text-slate-400">No services found.</div>
                    ) : (
                        services.map((service) => (
                            <div key={service._id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div>
                                            <div className="text-lg font-semibold text-white">{service.name}</div>
                                            <div className="text-sm text-slate-400">{service.description}</div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                                            <Badge variant={service.isPublished ? "success" : "warning"}>{service.isPublished ? "Published" : "Draft"}</Badge>
                                            <Badge variant="accent">{service.duration} min</Badge>
                                            <Badge variant="accent">Capacity {service.capacity}</Badge>
                                            <Badge variant="accent">{service.venue}</Badge>
                                            <Badge variant="accent">{service.assignmentMode}</Badge>
                                            <Badge variant={service.autoConfirm ? "success" : "warning"}>{service.autoConfirm ? "Auto confirm on" : "Manual confirm"}</Badge>
                                        </div>
                                    </div>
                                </div>

                                <ServiceCardActions service={service} />
                            </div>
                        ))
                    )}
                </CardContent>
            )}
        </Card>
    );
}

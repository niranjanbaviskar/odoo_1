"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import { toast } from "sonner";
import { Calendar, Clock4, MapPin, Users } from "lucide-react";
import { useBookingStore } from "@/store/booking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { dateLabel } from "@/lib/schedule";

type Service = {
    _id: string;
    name: string;
    description: string;
    duration: number;
    capacity: number;
    venue?: string;
    providerIds?: Array<{ _id: string; name: string; email?: string } | string>;
    customQuestions?: Array<{ label: string; type: string; required: boolean; options?: string[]; placeholder?: string }>;
};

type ProviderSlot = {
    providerId: string;
    providerName: string;
    slots: Array<{ time: string; label: string }>;
};

export function BookingWizard({ services, preselectedServiceId = "" }: { services: Service[]; preselectedServiceId?: string }) {
    const router = useRouter();
    const { serviceId, providerId, date, time, numberOfPeople, setField, reset } = useBookingStore();
    const [availability, setAvailability] = useState<ProviderSlot[] | null>(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const selectedService = services.find((service) => service._id === (serviceId || preselectedServiceId)) ?? services[0];
    const selectedProvider = providerId || (typeof selectedService?.providerIds?.[0] === "string" ? selectedService.providerIds[0] : selectedService?.providerIds?.[0]?._id) || "";
    const currentDate = date ? new Date(date) : undefined;
    const currentProviderSlots = useMemo(() => {
        if (!availability?.length) {
            return null;
        }

        return availability.find((entry) => entry.providerId === selectedProvider) ?? availability[0];
    }, [availability, selectedProvider]);
    const slots = currentProviderSlots?.slots ?? [];
    const loadingSlots = Boolean(date && availability === null);

    useEffect(() => {
        if (!serviceId && preselectedServiceId) {
            setField("serviceId", preselectedServiceId);
        }
    }, [preselectedServiceId, serviceId, setField]);

    useEffect(() => {
        if (!selectedService || !date) {
            return;
        }

        let active = true;

        fetch(`/api/service/${selectedService._id}/availability?date=${date}`)
            .then((response) => response.json())
            .then((data: { providerSlots?: ProviderSlot[] }) => {
                if (!active) {
                    return;
                }

                const nextAvailability = data.providerSlots ?? [];
                setAvailability(nextAvailability);

                const preferredProvider = nextAvailability.find((entry) => entry.providerId === providerId) ?? nextAvailability[0];
                if (preferredProvider && !providerId) {
                    setField("providerId", preferredProvider.providerId);
                }
            })
            .catch(() => {
                if (active) {
                    setAvailability([]);
                }
            });

        return () => {
            active = false;
        };
    }, [date, providerId, selectedService, setField]);

    const selectedQuestions = useMemo(() => selectedService?.customQuestions ?? [], [selectedService]);

    function chooseDate(picked?: Date) {
        setField("date", picked ? picked.toISOString().slice(0, 10) : "");
        setField("time", "");
        setAvailability(null);
    }

    function chooseProvider(providerValue: string) {
        setField("providerId", providerValue);
        setField("time", "");
    }

    function chooseService(value: string) {
        setField("serviceId", value);
        setField("providerId", "");
        setField("date", "");
        setField("time", "");
        setAvailability(null);
    }

    async function submitBooking() {
        if (!selectedService || !providerId || !date || !time) {
            toast.error("Choose a service, provider, date, and time first");
            return;
        }

        setBookingLoading(true);
        try {
            const response = await fetch("/api/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceId: selectedService._id,
                    providerId,
                    date,
                    time,
                    numberOfPeople,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    answers: Object.entries(answers).map(([question, answer]) => ({ question, answer })),
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ?? "Booking failed");
            }

            // If the service requires payment, booking.paymentStatus will be 'pending'
            if (data.booking?.paymentStatus === "pending") {
                toast.success("Booking created — redirecting to payment");
                reset();
                router.push(`/payment?bookingId=${data.booking._id}`);
            } else {
                toast.success("Booking confirmed");
                reset();
                router.push(`/dashboard`);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to book appointment");
        } finally {
            setBookingLoading(false);
        }
    }

    if (!selectedService) {
        return <Card className="border-white/10 bg-white/5 text-white">No services available yet.</Card>;
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-white/10 bg-white/5">
                <CardHeader>
                    <CardTitle className="text-2xl">Book an appointment</CardTitle>
                    <CardDescription>Live slot lookup, capacity checks, and provider-aware scheduling.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Appointment type</Label>
                            <Select value={serviceId || preselectedServiceId} onChange={(event) => chooseService(event.target.value)}>
                                {services.map((service) => (
                                    <option key={service._id} value={service._id}>
                                        {service.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Label>Provider</Label>
                            <Select value={providerId} onChange={(event) => chooseProvider(event.target.value)}>
                                <option value="">Select provider</option>
                                {selectedService.providerIds?.map((provider) => {
                                    const providerValue = typeof provider === "string" ? provider : provider._id;
                                    const providerLabel = typeof provider === "string" ? provider : provider.name;
                                    return (
                                        <option key={providerValue} value={providerValue}>
                                            {providerLabel}
                                        </option>
                                    );
                                })}
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                            <Calendar className="h-4 w-4 text-cyan-300" />
                            Choose a date
                        </div>
                        <DayPicker
                            mode="single"
                            selected={currentDate}
                            onSelect={chooseDate}
                            className="rounded-2xl bg-transparent text-white"
                        />
                    </div>

                    <div>
                        <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                            <Clock4 className="h-4 w-4 text-cyan-300" />
                            Available time slots
                        </div>
                        {loadingSlots ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className="h-12 animate-pulse rounded-2xl bg-white/10" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {slots.length ? slots.map((slot) => (
                                    <button
                                        key={slot.time}
                                        type="button"
                                        onClick={() => setField("time", slot.time)}
                                        className={cn(
                                            "rounded-2xl border px-4 py-3 text-left text-sm transition",
                                            time === slot.time ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-slate-950/60 text-slate-200 hover:border-cyan-400/30",
                                        )}
                                    >
                                        {slot.label}
                                    </button>
                                )) : <p className="col-span-full text-sm text-slate-400">Pick a date to load real-time slots.</p>}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Name</Label>
                            <Input value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} placeholder="Your name" />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} placeholder="you@example.com" />
                        </div>
                    </div>
                    <div>
                        <Label>Phone</Label>
                        <Input value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} placeholder="+1 555 000 1234" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Number of people</Label>
                            <Input type="number" min={1} max={selectedService.capacity} value={numberOfPeople} onChange={(event) => setField("numberOfPeople", Number(event.target.value))} />
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                            <Users className="mb-2 h-4 w-4 text-cyan-300" />
                            Capacity: {selectedService.capacity}
                            <div className="mt-1">Duration: {selectedService.duration} minutes</div>
                        </div>
                    </div>

                    {selectedQuestions.map((question) => (
                        <div key={question.label}>
                            <Label>{question.label}</Label>
                            {question.type === "textarea" ? (
                                <Textarea placeholder={question.placeholder} value={answers[question.label] ?? ""} onChange={(event) => setAnswers({ ...answers, [question.label]: event.target.value })} />
                            ) : (
                                <Input placeholder={question.placeholder} value={answers[question.label] ?? ""} onChange={(event) => setAnswers({ ...answers, [question.label]: event.target.value })} />
                            )}
                        </div>
                    ))}

                    <Button className="w-full" variant="accent" onClick={submitBooking} disabled={bookingLoading}>
                        {bookingLoading ? "Confirming..." : `Confirm booking ${date ? dateLabel(date, time || "09:00") : ""}`}
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
                <CardHeader>
                    <CardTitle>Selection summary</CardTitle>
                    <CardDescription>Everything updates dynamically as you choose the service and date.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-300">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="font-medium text-white">{selectedService.name}</div>
                        <div className="mt-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-300" />{selectedService.venue ?? "Online"}</div>
                        <div className="mt-1 flex items-center gap-2"><Users className="h-4 w-4 text-cyan-300" />Capacity {selectedService.capacity}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="font-medium text-white">Provider</div>
                        <div className="mt-1">{providerId || "Select a provider"}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="font-medium text-white">Date & time</div>
                        <div className="mt-1">{date || "Choose a date"} {time ? `• ${time}` : ""}</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

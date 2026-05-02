"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function BookingActions({ bookingId }: { bookingId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState<"cancel" | "reschedule" | null>(null);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    async function cancelBooking() {
        setLoading("cancel");
        try {
            const response = await fetch(`/api/booking/${bookingId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "Cancelled by user" }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? "Unable to cancel booking");
            toast.success("Booking cancelled");
            router.push("/booking");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to cancel booking");
        } finally {
            setLoading(null);
        }
    }

    async function rescheduleBooking() {
        if (!date || !time) {
            toast.error("Choose a new date and time");
            return;
        }

        setLoading("reschedule");
        try {
            const response = await fetch(`/api/booking/${bookingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reschedule", date, time }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? "Unable to reschedule booking");
            toast.success("Booking rescheduled");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to reschedule booking");
        } finally {
            setLoading(null);
        }
    }

    return (
        <Card className="border-white/10 bg-white/5">
            <CardContent className="space-y-4 pt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                    </div>
                    <div>
                        <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={cancelBooking} disabled={loading !== null}>
                        {loading === "cancel" ? "Cancelling..." : "Cancel"}
                    </Button>
                    <Button variant="accent" onClick={rescheduleBooking} disabled={loading !== null}>
                        {loading === "reschedule" ? "Rescheduling..." : "Reschedule"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

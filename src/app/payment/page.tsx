"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentPage() {
    const router = useRouter();
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [booking, setBooking] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // read bookingId from window.location (CSR) to avoid useSearchParams SSR issues
        if (!bookingId) {
            try {
                const params = new URLSearchParams(window.location.search);
                const id = params.get("bookingId");
                if (id) setBookingId(id);
            } catch (e) {
                // ignore
            }
            return;
        }

        fetch(`/api/booking/${bookingId}`)
            .then((res) => res.json())
            .then((data) => {
                setBooking(data.booking ?? null);
            })
            .catch(() => setBooking(null));
    }, [bookingId]);

    async function handlePay() {
        if (!bookingId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/booking/${bookingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "pay" }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? "Payment failed");
            toast.success(data.message ?? "Payment successful");
            router.push(`/dashboard`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Payment failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <Card className="border-white/10 bg-white/5">
                <CardHeader>
                    <CardTitle>Payment</CardTitle>
                </CardHeader>
                <CardContent>
                    {!booking ? (
                        <div className="text-sm text-slate-400">Loading booking...</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-sm text-slate-300">Service: {booking.serviceId?.name ?? booking.serviceId}</div>
                            <div className="text-sm text-slate-300">Date: {booking.date} • {booking.time}</div>
                            <div className="text-sm text-slate-300">Customer: {booking.customerName}</div>
                            <div className="text-sm text-slate-300">Payment: This is a simulated payment page — click Pay to complete booking.</div>
                            <div className="pt-4">
                                <Button variant="accent" onClick={handlePay} disabled={loading}>
                                    {loading ? "Processing…" : "Pay now"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

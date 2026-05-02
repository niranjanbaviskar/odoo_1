"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function BookingCardActions({ bookingId, canConfirm = false }: { bookingId: string; canConfirm?: boolean }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        if (!confirm("Cancel this booking?")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/booking/${bookingId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Cancelled by organizer" }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to cancel");
            toast.success("Booking cancelled");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message ?? "Unable to cancel booking");
        } finally {
            setLoading(false);
        }
    }

    async function handleConfirm() {
        setLoading(true);
        try {
            const res = await fetch(`/api/booking/${bookingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "confirm" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to confirm");
            toast.success("Booking confirmed");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message ?? "Unable to confirm booking");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-3 flex flex-wrap gap-2">
            {canConfirm && (
                <Button size="sm" variant="accent" onClick={handleConfirm} disabled={loading}>
                    Confirm
                </Button>
            )}
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading}>
                Cancel
            </Button>
        </div>
    );
}

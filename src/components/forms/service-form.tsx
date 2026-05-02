"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ServiceForm({ organizerId = "" }: { organizerId?: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        duration: 30,
        capacity: 1,
        venue: "Online",
        organizerId,
        providerIdsCsv: organizerId,
        isPublished: true,
        requiresPayment: false,
        autoConfirm: true,
        assignmentMode: "auto",
        scheduleJson: JSON.stringify(
            {
                timezone: "UTC",
                slotInterval: 15,
                bufferMinutes: 0,
                workingDays: [
                    { day: 1, active: true, windows: [{ start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] }] },
                    { day: 2, active: true, windows: [{ start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] }] },
                    { day: 3, active: true, windows: [{ start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] }] },
                    { day: 4, active: true, windows: [{ start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] }] },
                    { day: 5, active: true, windows: [{ start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] }] },
                ],
                overrides: [],
            },
            null,
            2,
        ),
        customQuestionsJson: JSON.stringify([{ label: "What do you need help with?", type: "textarea", required: true, options: [], placeholder: "Describe your goal" }], null, 2),
    });

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/service", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    duration: Number(form.duration),
                    capacity: Number(form.capacity),
                    venue: form.venue,
                    organizerId: form.organizerId || undefined,
                    providerIds: form.providerIdsCsv.split(",").map((value) => value.trim()).filter(Boolean),
                    isPublished: form.isPublished,
                    requiresPayment: form.requiresPayment,
                    autoConfirm: form.autoConfirm,
                    assignmentMode: form.assignmentMode,
                    schedule: JSON.parse(form.scheduleJson),
                    customQuestions: JSON.parse(form.customQuestionsJson),
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error ?? "Unable to save service");
            }
            toast.success("Service saved");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to save service");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="border-white/10 bg-white/5">
            <CardHeader>
                <CardTitle>Create appointment type</CardTitle>
                <CardDescription>Use JSON inputs for schedule overrides and custom questions so the full scheduling model stays flexible.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                    <div className="md:col-span-2"><Label>Name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
                    <div className="md:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
                    <div><Label>Duration</Label><Input type="number" value={form.duration} onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })} /></div>
                    <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} /></div>
                    <div><Label>Venue</Label><Input value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} /></div>
                    <div><Label>Organizer ID</Label><Input value={form.organizerId} onChange={(event) => setForm({ ...form, organizerId: event.target.value })} placeholder="Optional for admins" /></div>
                    <div><Label>Provider IDs</Label><Input value={form.providerIdsCsv} onChange={(event) => setForm({ ...form, providerIdsCsv: event.target.value })} placeholder="Comma-separated Mongo IDs" /></div>
                    <div><Label>Assignment mode</Label><Select value={form.assignmentMode} onChange={(event) => setForm({ ...form, assignmentMode: event.target.value })}><option value="auto">Auto</option><option value="manual">Manual</option></Select></div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} /> <span>Published</span></div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"><input type="checkbox" checked={form.autoConfirm} onChange={(event) => setForm({ ...form, autoConfirm: event.target.checked })} /> <span>Auto confirm</span></div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"><input type="checkbox" checked={form.requiresPayment} onChange={(event) => setForm({ ...form, requiresPayment: event.target.checked })} /> <span>Requires payment</span></div>
                    <div className="md:col-span-2"><Label>Schedule JSON</Label><Textarea className="font-mono text-xs" value={form.scheduleJson} onChange={(event) => setForm({ ...form, scheduleJson: event.target.value })} /></div>
                    <div className="md:col-span-2"><Label>Custom Questions JSON</Label><Textarea className="font-mono text-xs" value={form.customQuestionsJson} onChange={(event) => setForm({ ...form, customQuestionsJson: event.target.value })} /></div>
                    <div className="md:col-span-2">
                        <Button variant="accent" disabled={loading}>{loading ? "Saving..." : "Save service"}</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

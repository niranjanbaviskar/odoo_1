"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type EditableService = {
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

export function ServiceCardActions({ service }: { service: EditableService }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(service);
    const [providerIdsCsv, setProviderIdsCsv] = useState((service.providerIds ?? []).join(", "));
    const [scheduleJson, setScheduleJson] = useState(JSON.stringify(service.schedule ?? { timezone: "UTC", slotInterval: 15, bufferMinutes: 0, workingDays: [], overrides: [] }, null, 2));
    const [customQuestionsJson, setCustomQuestionsJson] = useState(JSON.stringify(service.customQuestions ?? [], null, 2));

    useEffect(() => {
        setForm(service);
        setProviderIdsCsv((service.providerIds ?? []).join(", "));
        setScheduleJson(JSON.stringify(service.schedule ?? { timezone: "UTC", slotInterval: 15, bufferMinutes: 0, workingDays: [], overrides: [] }, null, 2));
        setCustomQuestionsJson(JSON.stringify(service.customQuestions ?? [], null, 2));
    }, [service]);

    async function handleSave() {
        setLoading(true);
        try {
            const res = await fetch(`/api/service/${service._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    duration: Number(form.duration),
                    capacity: Number(form.capacity),
                    venue: form.venue,
                    isPublished: form.isPublished,
                    autoConfirm: form.autoConfirm,
                    requiresPayment: form.requiresPayment,
                    assignmentMode: form.assignmentMode,
                    providerIds: providerIdsCsv.split(",").map((value) => value.trim()).filter(Boolean),
                    schedule: JSON.parse(scheduleJson),
                    customQuestions: JSON.parse(customQuestionsJson),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Unable to save service");
            toast.success("Service updated");
            setEditing(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message ?? "Unable to update service");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Delete this service? This cannot be undone")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/service/${service._id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Unable to delete service");
            toast.success("Service deleted");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message ?? "Unable to delete service");
        } finally {
            setLoading(false);
        }
    }

    if (!editing) {
        return (
            <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={loading}>
                    Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading}>
                    Delete
                </Button>
            </div>
        );
    }

    return (
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                    <Label>Duration</Label>
                    <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
                </div>
                <div>
                    <Label>Capacity</Label>
                    <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                </div>
                <div>
                    <Label>Venue</Label>
                    <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                    <Label>Provider IDs</Label>
                    <Input value={providerIdsCsv} onChange={(e) => setProviderIdsCsv(e.target.value)} placeholder="Comma-separated provider IDs" />
                </div>
                <div>
                    <Label>Assignment mode</Label>
                    <Select value={form.assignmentMode} onChange={(e) => setForm({ ...form, assignmentMode: e.target.value })}>
                        <option value="auto">Auto</option>
                        <option value="manual">Manual</option>
                    </Select>
                </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3 text-sm text-slate-200">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                    Published
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.autoConfirm} onChange={(e) => setForm({ ...form, autoConfirm: e.target.checked })} />
                    Auto confirm
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.requiresPayment} onChange={(e) => setForm({ ...form, requiresPayment: e.target.checked })} />
                    Requires payment
                </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                    <Label>Schedule JSON</Label>
                    <Textarea className="font-mono text-xs" value={scheduleJson} onChange={(e) => setScheduleJson(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                    <Label>Custom Questions JSON</Label>
                    <Textarea className="font-mono text-xs" value={customQuestionsJson} onChange={(e) => setCustomQuestionsJson(e.target.value)} />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="accent" onClick={handleSave} disabled={loading}>
                    Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={loading}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileForm() {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: "", phone: "", timezone: "UTC", email: "", role: "" });

    useEffect(() => {
        fetch("/api/profile")
            .then((response) => response.json())
            .then((data) => {
                if (data.user) {
                    setForm({
                        name: data.user.name ?? "",
                        phone: data.user.phone ?? "",
                        timezone: data.user.timezone ?? "UTC",
                        email: data.user.email ?? "",
                        role: data.user.role ?? "",
                    });
                }
            });
    }, []);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: form.name, phone: form.phone, timezone: form.timezone }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error ?? "Unable to update profile");
            }
            toast.success("Profile updated");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to update profile");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="border-white/10 bg-white/5">
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Keep your details current so bookings and notifications stay accurate.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                    <div>
                        <Label>Name</Label>
                        <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    </div>
                    <div>
                        <Label>Email</Label>
                        <Input value={form.email} disabled />
                    </div>
                    <div>
                        <Label>Phone</Label>
                        <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                    </div>
                    <div>
                        <Label>Timezone</Label>
                        <Input value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                        <Button variant="accent" disabled={loading}>{loading ? "Saving..." : "Save changes"}</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

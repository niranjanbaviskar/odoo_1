"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const routes = {
    signup: "/api/auth/signup",
    login: "/api/auth/login",
    verify: "/api/auth/verify-otp",
    forgot: "/api/auth/forgot-password",
    reset: "/api/auth/reset-password",
} as const;

export type AuthMode = keyof typeof routes;

export function AuthForm({ mode, defaultEmail = "" }: { mode: AuthMode; defaultEmail?: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: defaultEmail,
        password: "",
        otp: "",
        role: "customer",
    });

    const title = useMemo(() => {
        switch (mode) {
            case "signup": return "Create account";
            case "login": return "Welcome back";
            case "verify": return "Verify OTP";
            case "forgot": return "Reset password";
            case "reset": return "Set new password";
        }
    }, [mode]);

    const description = useMemo(() => {
        switch (mode) {
            case "signup": return "Register with OTP verification to unlock booking and dashboards.";
            case "login": return "Sign in to manage bookings, services, and reporting.";
            case "verify": return "Enter the OTP sent to your email.";
            case "forgot": return "Request a reset OTP for your account.";
            case "reset": return "Use the OTP to set a new password.";
        }
    }, [mode]);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setLoading(true);

        const body =
            mode === "signup"
                ? { name: form.name, email: form.email, password: form.password, role: form.role }
                : mode === "login"
                    ? { email: form.email, password: form.password }
                    : mode === "verify"
                        ? { email: form.email, otp: form.otp }
                        : mode === "forgot"
                            ? { email: form.email }
                            : { email: form.email, otp: form.otp, password: form.password };

        try {
            const response = await fetch(routes[mode], {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ?? "Something went wrong");
            }

            toast.success(data.message ?? "Success");

            if (mode === "signup") {
                router.push(`/auth/verify?email=${encodeURIComponent(form.email)}`);
            } else if (mode === "verify" || mode === "login" || mode === "reset") {
                const targetRoute = data.user?.role === "admin" ? "/admin" : "/dashboard";
                router.push(targetRoute);
                router.refresh();
            } else if (mode === "forgot") {
                router.push(`/auth/reset-password?email=${encodeURIComponent(form.email)}`);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Request failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="mx-auto w-full max-w-lg border-white/10 bg-white/5">
            <CardHeader>
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {mode === "signup" && (
                        <div>
                            <Label htmlFor="name">Full name</Label>
                            <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Alex Morgan" />
                        </div>
                    )}
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" />
                    </div>
                    {(mode === "signup" || mode === "login" || mode === "reset") && (
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Minimum 8 characters" />
                        </div>
                    )}
                    {(mode === "verify" || mode === "reset") && (
                        <div>
                            <Label htmlFor="otp">OTP</Label>
                            <Input id="otp" value={form.otp} onChange={(event) => setForm({ ...form, otp: event.target.value })} placeholder="123456" maxLength={6} />
                        </div>
                    )}
                    {mode === "signup" && (
                        <div>
                            <Label htmlFor="role">Role</Label>
                            <Select id="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                                <option value="customer">Customer</option>
                                <option value="organizer">Organizer</option>
                                <option value="admin">Admin</option>
                            </Select>
                        </div>
                    )}
                    <Button type="submit" className="w-full" variant="accent" disabled={loading}>
                        {loading ? "Processing..." : title}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

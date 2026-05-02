"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CalendarDays, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type SessionUser = {
    name: string;
    email: string;
    role: string;
} | null;

export function SiteHeader() {
    const [user, setUser] = useState<SessionUser>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // include credentials to ensure the session cookie is sent
        fetch("/api/auth/me", { credentials: "include" })
            .then(async (response) => {
                if (!response.ok) {
                    setUser(null);
                    return;
                }
                const data = await response.json();
                setUser(data.user ?? null);
            })
            .catch(() => setUser(null));
    }, [pathname]);

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        router.refresh();
        router.push("/");
    }

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-3 text-white">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/20">
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        <span>
                            <span className="block text-base font-semibold tracking-tight">PulseBook</span>
                            <span className="block text-xs text-slate-400">Appointments without friction</span>
                        </span>
                    </Link>
                    {user && (
                        <div className="hidden items-center gap-2 border-l border-white/10 pl-6 sm:flex">
                            <div>
                                <div className="text-sm font-medium text-white">{user.name}</div>
                                <div className="text-xs text-cyan-400 uppercase tracking-wide">{user.role}</div>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
                    {!user || user.role === "customer" ? (
                        <Link href="/booking" className="transition hover:text-white">Book</Link>
                    ) : null}
                </nav>

                <div className="flex items-center gap-3">
                    <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 md:inline-flex">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                        Real-time slots
                    </span>
                    {user ? (
                        <>
                            <Link href="/profile" className="hidden text-sm text-slate-300 transition hover:text-white sm:inline">
                                {user.name}
                            </Link>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                Logout
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/auth/login" className="inline-flex h-9 items-center justify-center rounded-full bg-transparent px-4 text-sm font-medium text-slate-200 transition hover:bg-white/10">
                                Login
                            </Link>
                            <Link href="/auth/sign-up" className="inline-flex h-9 items-center justify-center rounded-full bg-cyan-400 px-4 text-sm font-medium text-slate-950 transition hover:bg-cyan-300">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

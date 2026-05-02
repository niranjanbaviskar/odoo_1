"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export function AdminUsersTable({ users, currentUserId }: { users: Array<{ _id: string; name: string; email: string; role: string; isActive: boolean; isVerified: boolean }>; currentUserId: string }) {
    const [rows, setRows] = useState(users);
    const nonAdminRows = rows.filter((user) => user.role !== "admin");
    const adminRows = rows.filter((user) => user.role === "admin");

    async function updateUser(userId: string, nextRole: string, nextActive: boolean) {
        const response = await fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, role: nextRole, isActive: nextActive }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error ?? "Unable to update user");
        }
        setRows((current) => current.map((row) => (row._id === userId ? { ...row, role: data.user.role, isActive: data.user.isActive } : row)));
        toast.success("User updated");
    }

    async function deleteUser(userId: string) {
        if (!confirm("Delete this user permanently? This will remove their services and bookings too.")) {
            return;
        }

        const response = await fetch("/api/admin/users", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error ?? "Unable to delete user");
        }

        setRows((current) => current.filter((row) => row._id !== userId));
        toast.success("User deleted permanently");
    }

    return (
        <Card className="border-white/10 bg-white/5">
            <CardContent className="space-y-3 pt-6">
                <div className="text-sm font-medium text-slate-300">Customers / Organizers</div>
                {nonAdminRows.length === 0 ? (
                    <div className="text-sm text-slate-400">No customer or organizer accounts found.</div>
                ) : (
                    nonAdminRows.map((user) => (
                        <div key={user._id} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 md:grid-cols-[1.5fr_0.8fr_0.8fr_auto_auto] md:items-center">
                            <div>
                                <div className="font-medium text-white">{user.name}</div>
                                <div className="text-sm text-slate-400">{user.email}</div>
                            </div>
                            <Select value={user.role} onChange={(event) => updateUser(user._id, event.target.value, user.isActive).catch((error) => toast.error(error.message))}>
                                <option value="customer">Customer</option>
                                <option value="organizer">Organizer</option>
                                <option value="admin">Admin</option>
                            </Select>
                            <span className="text-sm text-slate-300">{user.isVerified ? "Verified" : "Unverified"}</span>
                            <Button variant={user.isActive ? "outline" : "accent"} onClick={() => updateUser(user._id, user.role, !user.isActive).catch((error) => toast.error(error.message))}>
                                {user.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => deleteUser(user._id).catch((error) => toast.error(error.message))}
                                disabled={user._id === currentUserId}
                            >
                                {user._id === currentUserId ? "Current admin" : "Delete"}
                            </Button>
                        </div>
                    ))
                )}

                {adminRows.length > 0 && (
                    <>
                        <div className="pt-4 text-sm font-medium text-slate-300">Admin accounts</div>
                        {adminRows.map((user) => (
                            <div key={user._id} className="grid gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 md:grid-cols-[1.5fr_0.8fr_0.8fr_auto_auto] md:items-center">
                                <div>
                                    <div className="font-medium text-white">{user.name}</div>
                                    <div className="text-sm text-slate-300">{user.email}</div>
                                </div>
                                <Select value={user.role} onChange={(event) => updateUser(user._id, event.target.value, user.isActive).catch((error) => toast.error(error.message))}>
                                    <option value="customer">Customer</option>
                                    <option value="organizer">Organizer</option>
                                    <option value="admin">Admin</option>
                                </Select>
                                <span className="text-sm text-slate-200">{user.isVerified ? "Verified" : "Unverified"}</span>
                                <Button variant={user.isActive ? "outline" : "accent"} onClick={() => updateUser(user._id, user.role, !user.isActive).catch((error) => toast.error(error.message))}>
                                    {user.isActive ? "Deactivate" : "Activate"}
                                </Button>
                                <Button variant="destructive" disabled>
                                    {user._id === currentUserId ? "Current admin" : "Delete disabled"}
                                </Button>
                            </div>
                        ))}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

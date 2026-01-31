"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, UserCog, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AdvisorRequest {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    department_id: string | null;
    section: string | null;
    semester: number | null;
    academic_year: string | null;
}

interface User {
    id: string;
    full_name: string;
    email: string;
}

export default function AdminAdvisorsPage() {
    const [loading, setLoading] = useState(true);
    const [advisors, setAdvisors] = useState<AdvisorRequest[]>([]);
    const [users, setUsers] = useState<User[]>([]); // Potential advisors (e.g. teachers)
    const [dialogOpen, setDialogOpen] = useState(false);

    // Form State
    const [selectedUser, setSelectedUser] = useState("");
    const [semester, setSemester] = useState("1");
    const [section, setSection] = useState("A");
    const [year, setYear] = useState("2025-26");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAdvisors();
        fetchUsers();
    }, []);

    const fetchAdvisors = async () => {
        try {
            const res = await fetch("/api/admin/advisors");
            if (res.ok) {
                const data = await res.json();
                setAdvisors(data.advisors || []);
            }
        } catch (error) {
            console.error("Failed to fetch advisors", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        // In a real app, maybe fetch users with role 'teacher' or just all users
        try {
            // Reusing existing endpoint or mocked call for brevity
            // Assuming we have an endpoint to get potential users
            const res = await fetch("/api/admin/users?role=advisor"); // Or generic user list
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const handleAssign = async () => {
        if (!selectedUser) {
            toast.error("Please select a user");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                user_id: selectedUser,
                semester: parseInt(semester),
                section,
                academic_year: year
            };

            const res = await fetch("/api/admin/advisors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Advisor assigned successfully");
                setDialogOpen(false);
                fetchAdvisors();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to assign advisor");
            }
        } catch (error) {
            toast.error("Error assigning advisor");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this advisor?")) return;
        try {
            const res = await fetch(`/api/admin/advisors?id=${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Advisor removed");
                setAdvisors(prev => prev.filter(a => a.id !== id));
            } else {
                toast.error("Failed to remove advisor");
            }
        } catch (error) {
            toast.error("Error removing advisor");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Class Advisors</h1>
                    <p className="text-neutral-500">Manage class advisor assignments</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Advisor
                </Button>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="animate-spin text-neutral-400" />
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Advisor Name</th>
                                    <th className="px-6 py-4">Class</th>
                                    <th className="px-6 py-4">Year</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {advisors.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-neutral-400">
                                            No class advisors assigned yet.
                                        </td>
                                    </tr>
                                ) : (
                                    advisors.map((adv) => (
                                        <tr key={adv.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600">
                                                        <UserCog size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">{adv.full_name || 'Unknown'}</p>
                                                        <p className="text-xs text-neutral-500">{adv.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap size={16} className="text-neutral-400" />
                                                    <span className="font-mono">
                                                        Sem {adv.semester} - Sec {adv.section}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500">{adv.academic_year || 'N/A'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(adv.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign New Advisor</DialogTitle>
                        <DialogDescription>
                            Select a user and assign them to a specific class section.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select User</Label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a user..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.full_name} ({u.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Semester</Label>
                                <Select value={semester} onValueChange={setSemester}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                            <SelectItem key={s} value={s.toString()}>Sem {s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Section</Label>
                                <Select value={section} onValueChange={setSection}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["A", "B", "C", "D"].map(s => (
                                            <SelectItem key={s} value={s}>Sec {s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Academic Year</Label>
                            <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2025-26" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssign} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assign Advisor
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

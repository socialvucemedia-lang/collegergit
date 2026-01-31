
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Allocation {
    id: string;
    section: string | null;
    batch: string | null;
    subjects: {
        id: string;
        name: string;
        code: string;
    };
}

export default function NewSessionPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [allocations, setAllocations] = useState<Allocation[]>([]);

    const [formData, setFormData] = useState({
        allocation_id: searchParams.get("allocation_id") || "",
        session_date: new Date().toISOString().split('T')[0],
        start_time: "09:00",
        end_time: "10:00",
        room: "",
        status: "active",
    });

    useEffect(() => {
        fetchAllocations();
    }, []);

    const fetchAllocations = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/teacher/classes", {
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setAllocations(data.allocations || []);

                // Auto-select first allocation if none selected
                if (!formData.allocation_id && data.allocations?.length > 0) {
                    setFormData(prev => ({ ...prev, allocation_id: data.allocations[0].id }));
                }
            }
        } catch (error) {
            console.error("Error fetching allocations:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectedAllocation = allocations.find(a => a.id === formData.allocation_id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAllocation) {
            toast.error("Please select a class allocation");
            return;
        }
        setSaving(true);
        try {
            const { data: { session: authSession } } = await supabase.auth.getSession();
            const response = await fetch("/api/teacher/sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authSession?.access_token}`,
                },
                body: JSON.stringify({
                    subject_id: selectedAllocation.subjects.id,
                    section: selectedAllocation.section,
                    batch: selectedAllocation.batch,
                    session_date: formData.session_date,
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    room: formData.room,
                    status: formData.status,
                }),
            });

            if (!response.ok) throw new Error("Failed to create session");

            const data = await response.json();
            toast.success("Session created! Let's mark attendance.");
            router.push(`/teacher/attendance/${data.session.id}`);
        } catch (error) {
            toast.error("Failed to create session");
        } finally {
            setSaving(false);
        }
    };

    const formatAllocationLabel = (alloc: Allocation) => {
        let label = `${alloc.subjects.code} - ${alloc.subjects.name}`;
        if (alloc.section) label += ` (Section ${alloc.section})`;
        if (alloc.batch) label += ` [Batch ${alloc.batch}]`;
        return label;
    };

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft size={18} />
                </Button>
                <h1 className="text-2xl font-bold">New Attendance Session</h1>
            </div>

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Class / Subject</Label>
                        <Select
                            value={formData.allocation_id}
                            onValueChange={(val) => setFormData({ ...formData, allocation_id: val })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {allocations.map(alloc => (
                                    <SelectItem key={alloc.id} value={alloc.id}>
                                        {formatAllocationLabel(alloc)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {allocations.length === 0 && (
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                No allocations found. Please contact admin to assign subjects.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                required
                                value={formData.session_date}
                                onChange={e => setFormData({ ...formData, session_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="room">Room</Label>
                            <Input
                                id="room"
                                placeholder="e.g. 302"
                                required
                                value={formData.room}
                                onChange={e => setFormData({ ...formData, room: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start">Start Time</Label>
                            <Input
                                id="start"
                                type="time"
                                required
                                value={formData.start_time}
                                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end">End Time</Label>
                            <Input
                                id="end"
                                type="time"
                                required
                                value={formData.end_time}
                                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={saving || allocations.length === 0} className="gap-2">
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Create & Start Marking
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

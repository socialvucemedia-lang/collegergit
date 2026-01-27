
"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, Clock, MapPin, Search, ChevronRight, CheckCircle, Circle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Subject {
    code: string;
    name: string;
}

interface Session {
    id: string;
    subject_id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    room: string;
    status: "scheduled" | "active" | "completed" | "cancelled";
    subjects: Subject;
}

export default function AttendancePage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [allocatedSubjects, setAllocatedSubjects] = useState<{ id: string, name: string, code: string }[]>([]);
    const [formData, setFormData] = useState({
        subject_id: "",
        session_date: new Date().toISOString().split('T')[0],
        start_time: "09:00",
        end_time: "10:00",
        room: "",
        status: "scheduled",
    });
    const router = useRouter();


    useEffect(() => {
        fetchSessions();
        fetchAllocatedSubjects();
    }, []);

    const fetchSessions = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/teacher/sessions", {
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
            toast.error("Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllocatedSubjects = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: teacher } = await supabase
                .from('teachers')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (teacher) {
                // Fetch allocations
                // Adjust this query based on your actual allocation logic/table
                // For now, fetching ALL subjects as a fallback if allocation table isn't populated
                const { data: subjects } = await supabase.from('subjects').select('id, name, code');
                setAllocatedSubjects(subjects || []);
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/teacher/sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to create session");

            const data = await response.json();
            toast.success("Session created successfully!");
            setIsDialogOpen(false);
            fetchSessions();
            // Optional: Redirect immediately to marking page
            // router.push(`/teacher/attendance/${data.session.id}`);
        } catch (error) {
            toast.error("Failed to create session");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "text-green-600 bg-green-50 dark:bg-green-900/20";
            case "active": return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
            case "scheduled": return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
            default: return "text-neutral-500 bg-neutral-100 dark:bg-neutral-800";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Attendance</h1>
                    <p className="text-neutral-500 mt-1">Manage your class sessions and attendance records.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus size={18} />
                            New Session
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Session</DialogTitle>
                            <DialogDescription>Schedule a new class session to mark attendance.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSession} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Select
                                    value={formData.subject_id}
                                    onValueChange={(val: string) => setFormData({ ...formData, subject_id: val })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allocatedSubjects.map(sub => (
                                            <SelectItem key={sub.id} value={sub.id}>
                                                {sub.code} - {sub.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">Create Session</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-12 text-neutral-500">Loading sessions...</div>
            ) : sessions.length === 0 ? (
                <Card className="p-12 text-center">
                    <Calendar className="mx-auto text-neutral-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No sessions found</h3>
                    <p className="text-neutral-500 mt-2">Create your first session to start marking attendance.</p>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sessions.map((session) => (
                        <Card
                            key={session.id}
                            className="p-4 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors cursor-pointer group"
                            onClick={() => router.push(`/teacher/attendance/${session.id}`)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)} capitalize`}>
                                    {session.status}
                                </div>
                                <ChevronRight className="text-neutral-400 group-hover:text-neutral-600 transition-colors" size={18} />
                            </div>

                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-1">
                                {session.subjects?.name}
                            </h3>
                            <p className="text-neutral-500 text-sm mb-4">{session.subjects?.code}</p>

                            <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>{new Date(session.session_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} />
                                    <span>{session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} />
                                    <span>{session.room || 'No Room'}</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

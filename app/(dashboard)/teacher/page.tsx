"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronRight, Users, CheckCircle2, BookOpen, MapPin, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Allocation {
    id: string;
    section: string;
    batch: string | null;
    subjects: {
        id: string;
        code: string;
        name: string;
    };
}

interface Session {
    id: string;
    subject_id: string;
    session_date: string;
    start_time: string;
    status: string;
}

export default function TeacherDashboard() {
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/teacher/classes", {
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setAllocations(data.allocations || []);
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const todayStr = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
    });

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-neutral-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">My Classes</h1>
                    <p className="text-sm text-neutral-500">{todayStr}</p>
                </div>
                <Link href="/teacher/attendance/new">
                    <Button className="gap-2">
                        <Plus size={18} />
                        New Session
                    </Button>
                </Link>
            </div>

            {allocations.length === 0 ? (
                <Card className="p-12 text-center">
                    <BookOpen className="mx-auto text-neutral-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium">No Subjects Allocated</h3>
                    <p className="text-neutral-500 mt-2">Contact Admin if you believe this is an error.</p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {allocations.map((alloc) => {
                        const todaySession = sessions.find(s => s.subject_id === alloc.subjects.id);

                        return (
                            <Link
                                href={todaySession ? `/teacher/attendance/${todaySession.id}` : `/teacher/attendance/new?subject_id=${alloc.subjects.id}&section=${alloc.section}`}
                                key={alloc.id}
                            >
                                <Card className={`p-4 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900 border-l-4 ${todaySession?.status === 'active' ? 'border-l-blue-500' :
                                    todaySession?.status === 'completed' ? 'border-l-green-500' : 'border-l-neutral-200 dark:border-l-neutral-800'
                                    }`}>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {alloc.subjects.name}
                                                </span>
                                                {todaySession?.status === 'active' && (
                                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none animate-pulse">Live</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-neutral-500">
                                                <Badge variant="secondary" className="font-mono text-[11px]">
                                                    {alloc.subjects.code}
                                                </Badge>
                                                <div className="flex items-center gap-1">
                                                    <Users size={14} />
                                                    Sec {alloc.section} {alloc.batch && `(${alloc.batch})`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-neutral-300">
                                            {todaySession?.status === 'completed' ? <CheckCircle2 size={20} className="text-green-500" /> : <ChevronRight size={20} />}
                                        </div>
                                    </div>

                                    {todaySession && (
                                        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-4 text-xs font-medium text-neutral-400">
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {todaySession.start_time.slice(0, 5)}
                                            </div>
                                            <div className="flex items-center gap-1 capitalize">
                                                <div className={`w-1.5 h-1.5 rounded-full ${todaySession.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                                {todaySession.status}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

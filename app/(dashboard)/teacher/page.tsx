"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronRight, Users, CheckCircle2, BookOpen, MapPin, Loader2, Plus, Coffee } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ScheduleItem {
    type: 'real' | 'virtual';
    division: string;
    data: {
        id: string;
        subject_id: string;
        session_date?: string;
        start_time: string;
        end_time: string;
        status: string;
        room?: string;
        section?: string; // from virtual
        batch?: string; // from virtual
        subjects: {
            id: string;
            code: string;
            name: string;
        };
    };
}

export default function TeacherDashboard() {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
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
                setSchedule(data.schedule || []);
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

    // Helper to calculate free time in minutes between two "HH:MM:SS" strings
    const getGapMinutes = (end: string, start: string) => {
        const [h1, m1] = end.split(':').map(Number);
        const [h2, m2] = start.split(':').map(Number);
        const date1 = new Date(2000, 0, 1, h1, m1);
        const date2 = new Date(2000, 0, 1, h2, m2);
        return (date2.getTime() - date1.getTime()) / 60000;
    };

    const renderScheduleWithGaps = () => {
        if (schedule.length === 0) return null;

        const result = [];
        for (let i = 0; i < schedule.length; i++) {
            const current = schedule[i];

            // Add free time check before current item (except first item if we only care about inter-session gaps)
            // Or we could check gap between prev (i-1) and current (i)
            if (i > 0) {
                const prev = schedule[i - 1];
                const gap = getGapMinutes(prev.data.end_time, current.data.start_time);

                if (gap >= 30) { // Only show gaps larger than 30 mins
                    const hours = Math.floor(gap / 60);
                    const mins = gap % 60;
                    const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

                    result.push(
                        <div key={`gap-${i}`} className="flex items-center gap-4 py-2 px-4 opacity-70">
                            <div className="w-1 h-12 border-l-2 border-dashed border-neutral-300 dark:border-neutral-700 mx-auto" />
                            <div className="flex-1 flex items-center gap-3 text-neutral-500">
                                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                                    <Coffee size={16} />
                                </div>
                                <span className="font-medium text-sm">Free Time ({durationStr})</span>
                            </div>
                        </div>
                    );
                }
            }

            result.push(renderSessionCard(current));
        }
        return result;
    };

    const renderSessionCard = (item: ScheduleItem) => {
        const isVirtual = item.type === 'virtual';
        const session = item.data;

        const linkHref = isVirtual
            ? `/teacher/attendance/new?subject_id=${session.subject_id}&section=${session.section}&start_time=${session.start_time}&end_time=${session.end_time}`
            : `/teacher/attendance/${session.id}`;

        const isCompleted = session.status === 'completed';
        const isActive = session.status === 'active';

        return (
            <Link href={linkHref} key={session.id} className="block group">
                <Card className={cn(
                    "relative overflow-hidden transition-all duration-300 border-2",
                    isActive ? "border-blue-500/50 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/5" : "border-transparent hover:border-neutral-200 dark:hover:border-neutral-800",
                    isVirtual ? "bg-neutral-50/50 dark:bg-neutral-900/20 border-dashed border-neutral-200 dark:border-neutral-800" : "bg-white dark:bg-neutral-900"
                )}>
                    {isActive && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500 text-white text-[10px] font-bold uppercase rounded-bl-xl z-10">
                            Live Now
                        </div>
                    )}

                    <div className="p-5">
                        <div className="flex justify-between items-start mb-5">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {session.subjects.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-[10px] text-neutral-500 border-neutral-200 dark:border-neutral-800">
                                        {session.subjects.code}
                                    </Badge>
                                    {item.data.batch && (
                                        <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                                            Batch {item.data.batch}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                                isCompleted ? "bg-green-100 dark:bg-green-900/30 text-green-600" :
                                    isActive ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" :
                                        "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700"
                            )}>
                                {isCompleted ? <CheckCircle2 size={20} /> : <ChevronRight size={20} />}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800/50">
                                <div className="p-1.5 bg-white dark:bg-neutral-800 rounded-md text-neutral-500 shadow-sm">
                                    <Clock size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400">Time</span>
                                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                        {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800/50">
                                <div className="p-1.5 bg-white dark:bg-neutral-800 rounded-md text-neutral-500 shadow-sm">
                                    <MapPin size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400">Classroom</span>
                                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                        {session.room || 'Not Assigned'}
                                    </span>
                                </div>
                            </div>

                            <div className="col-span-2 flex items-center gap-3 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800/50">
                                <div className="p-1.5 bg-white dark:bg-neutral-800 rounded-md text-neutral-500 shadow-sm">
                                    <Users size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400">Target Audience</span>
                                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                        Division {item.division} {item.data.batch ? `• Batch ${item.data.batch}` : '• Entire Class'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </Link>
        );
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-neutral-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">My Schedule</h1>
                    <p className="text-sm text-neutral-500 font-medium">{todayStr}</p>
                </div>
                <Link href="/teacher/attendance/new">
                    <Button size="sm" className="gap-2 rounded-full shadow-lg shadow-blue-500/20">
                        <Plus size={16} />
                        New Entry
                    </Button>
                </Link>
            </div>

            {schedule.length === 0 ? (
                <Card className="p-12 text-center border-dashed bg-neutral-50/50 dark:bg-neutral-900/20">
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                        <BookOpen size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">No Classes Scheduled</h3>
                    <p className="text-neutral-500 mt-2 max-w-xs mx-auto">You don't have any classes scheduled for today. Enjoy your free time!</p>
                </Card>
            ) : (
                <div className="space-y-1">
                    {renderScheduleWithGaps()}
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Session {
    id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    room: string;
    status: string;
    subjects: { code: string; name: string };
    attendance_count?: { present: number; absent: number };
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function SessionHistoryPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const router = useRouter();

    useEffect(() => {
        fetchSessions();
    }, [currentMonth, currentYear]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const { data: { session: authSession } } = await supabase.auth.getSession();
            const response = await fetch(`/api/teacher/sessions?month=${currentMonth + 1}&year=${currentYear}`, {
                headers: {
                    Authorization: `Bearer ${authSession?.access_token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
            toast.error("Failed to load session history");
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const getSessionsForDate = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return sessions.filter(s => s.session_date === dateStr);
    };

    const navigateMonth = (direction: number) => {
        let newMonth = currentMonth + direction;
        let newYear = currentYear;
        if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const paddingDays = Array.from({ length: firstDay }, (_, i) => i);

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Session History</h1>
                    <p className="text-neutral-500 mt-1">View all past and upcoming sessions.</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/teacher/attendance')}>
                    Back to Sessions
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                    <p className="text-sm text-neutral-500">Total Sessions</p>
                    <p className="text-2xl font-bold">{totalSessions}</p>
                </Card>
                <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{completedSessions}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-neutral-500">Pending</p>
                    <p className="text-2xl font-bold">{totalSessions - completedSessions}</p>
                </Card>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                    <ChevronLeft size={20} />
                </Button>
                <h2 className="text-xl font-semibold">{MONTHS[currentMonth]} {currentYear}</h2>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                    <ChevronRight size={20} />
                </Button>
            </div>

            {/* Calendar Grid */}
            <Card className="p-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-medium text-neutral-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                {loading ? (
                    <div className="text-center py-12 text-neutral-500">Loading...</div>
                ) : (
                    <div className="grid grid-cols-7 gap-1">
                        {/* Padding for first week */}
                        {paddingDays.map(i => (
                            <div key={`pad-${i}`} className="aspect-square bg-neutral-50 dark:bg-neutral-900 rounded" />
                        ))}

                        {/* Actual days */}
                        {days.map(day => {
                            const daySessions = getSessionsForDate(day);
                            const hasCompleted = daySessions.some(s => s.status === 'completed');
                            const hasPending = daySessions.some(s => s.status !== 'completed');
                            const isToday = day === new Date().getDate() &&
                                currentMonth === new Date().getMonth() &&
                                currentYear === new Date().getFullYear();

                            return (
                                <div
                                    key={day}
                                    className={`aspect-square p-1 rounded border transition-colors ${isToday ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-200 dark:border-neutral-800'
                                        } ${daySessions.length > 0 ? 'cursor-pointer hover:border-neutral-400' : ''}`}
                                    onClick={() => daySessions.length > 0 && router.push(`/teacher/attendance/${daySessions[0].id}`)}
                                >
                                    <div className="text-xs font-medium text-neutral-500">{day}</div>
                                    {daySessions.length > 0 && (
                                        <div className="mt-1 space-y-0.5">
                                            {daySessions.slice(0, 2).map(s => (
                                                <div
                                                    key={s.id}
                                                    className={`text-[10px] px-1 py-0.5 rounded truncate ${s.status === 'completed'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                        }`}
                                                >
                                                    {s.subjects?.code}
                                                </div>
                                            ))}
                                            {daySessions.length > 2 && (
                                                <div className="text-[10px] text-neutral-400">+{daySessions.length - 2} more</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Session List for Month */}
            <div>
                <h3 className="font-semibold mb-3">All Sessions in {MONTHS[currentMonth]}</h3>
                {sessions.length === 0 ? (
                    <Card className="p-8 text-center text-neutral-500">
                        No sessions found for this month.
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {sessions.map(session => (
                            <Card
                                key={session.id}
                                className="p-3 flex items-center justify-between hover:border-neutral-400 cursor-pointer"
                                onClick={() => router.push(`/teacher/attendance/${session.id}`)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${session.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'
                                        }`} />
                                    <div>
                                        <p className="font-medium">{session.subjects?.code} - {session.subjects?.name}</p>
                                        <p className="text-sm text-neutral-500">
                                            {new Date(session.session_date).toLocaleDateString()} • {session.start_time?.slice(0, 5)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded capitalize ${session.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {session.status}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`/api/teacher/sessions/${session.id}/export`, '_blank');
                                        }}
                                    >
                                        <Download size={14} />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

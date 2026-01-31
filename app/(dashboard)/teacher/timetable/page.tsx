"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Play, Loader2, ChevronRight, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface TimetableSlot {
    id: string;
    subject_id: string;
    teacher_id: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string | null;
    section: string | null;
    subjects: {
        id: string;
        code: string;
        name: string;
    };
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

export default function TeacherTimetablePage() {
    const router = useRouter();
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [teacherId, setTeacherId] = useState<string | null>(null);

    const today = new Date().getDay();
    const currentTime = new Date().toTimeString().slice(0, 5);

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Get teacher ID
            const { data: teacher } = await supabase
                .from('teachers')
                .select('id')
                .eq('user_id', session.user.id)
                .single();

            if (!teacher) {
                toast.error("Teacher profile not found");
                return;
            }
            setTeacherId(teacher.id);

            // Fetch all timetable slots for this teacher
            const { data, error } = await supabase
                .from('timetable_slots')
                .select(`
                    *,
                    subjects (
                        id,
                        code,
                        name
                    )
                `)
                .eq('teacher_id', teacher.id)
                .order('day_of_week', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) throw error;
            setSlots(data || []);
        } catch (error) {
            console.error("Error fetching timetable:", error);
            toast.error("Failed to load timetable");
        } finally {
            setLoading(false);
        }
    };

    // Group slots by day
    const slotsByDay = useMemo(() => {
        const grouped: Record<number, TimetableSlot[]> = {};
        DAYS.forEach((_, i) => grouped[i] = []);
        slots.forEach(slot => {
            if (grouped[slot.day_of_week]) {
                grouped[slot.day_of_week].push(slot);
            }
        });
        return grouped;
    }, [slots]);

    // Calculate free slots for a day
    const getFreeSlots = (daySlots: TimetableSlot[]) => {
        if (daySlots.length === 0) return [];

        const sortedSlots = [...daySlots].sort((a, b) => a.start_time.localeCompare(b.start_time));
        const freeSlots: { start: string; end: string }[] = [];

        // Check gap before first class (from 08:00)
        if (sortedSlots[0].start_time > "08:00") {
            freeSlots.push({ start: "08:00", end: sortedSlots[0].start_time });
        }

        // Check gaps between classes
        for (let i = 0; i < sortedSlots.length - 1; i++) {
            const currentEnd = sortedSlots[i].end_time;
            const nextStart = sortedSlots[i + 1].start_time;
            if (currentEnd < nextStart) {
                freeSlots.push({ start: currentEnd, end: nextStart });
            }
        }

        // Check gap after last class (until 18:00)
        const lastSlot = sortedSlots[sortedSlots.length - 1];
        if (lastSlot.end_time < "18:00") {
            freeSlots.push({ start: lastSlot.end_time, end: "18:00" });
        }

        return freeSlots;
    };

    const handleStartSession = async (slot: TimetableSlot) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch("/api/teacher/sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    subject_id: slot.subjects.id,
                    section: slot.section,
                    batch: null,
                    session_date: new Date().toISOString().split('T')[0],
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    room: slot.room || "",
                    status: "active",
                }),
            });

            if (!response.ok) throw new Error("Failed to create session");

            const data = await response.json();
            toast.success("Session started!");
            router.push(`/teacher/attendance/${data.session.id}`);
        } catch (error) {
            toast.error("Failed to start session");
        }
    };

    const isCurrentSlot = (slot: TimetableSlot) => {
        return slot.day_of_week === today &&
            slot.start_time <= currentTime &&
            slot.end_time > currentTime;
    };

    const isUpcoming = (slot: TimetableSlot) => {
        return slot.day_of_week === today && slot.start_time > currentTime;
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-neutral-400" size={32} />
            </div>
        );
    }

    const todaySlots = slotsByDay[today] || [];
    const todayFreeSlots = getFreeSlots(todaySlots);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">My Timetable</h1>
                <p className="text-neutral-500 mt-1">Your weekly schedule and quick session actions</p>
            </div>

            {/* Today's Schedule - Prominent */}
            <Card className="p-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                <div className="flex items-center gap-3 mb-4">
                    <Calendar className="text-blue-600" size={24} />
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        Today - {DAYS[today]}
                    </h2>
                    <Badge variant="secondary" className="ml-auto">
                        {todaySlots.length} Classes
                    </Badge>
                </div>

                {todaySlots.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                        <Coffee className="mx-auto mb-2" size={32} />
                        <p>No classes scheduled for today. Enjoy your free day!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todaySlots.map((slot) => (
                            <div
                                key={slot.id}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-lg border transition-all",
                                    isCurrentSlot(slot)
                                        ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700"
                                        : isUpcoming(slot)
                                            ? "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                                            : "bg-neutral-100 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 opacity-60"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-center min-w-[80px]">
                                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                            {slot.start_time.slice(0, 5)}
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            {slot.end_time.slice(0, 5)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                            {slot.subjects.code} - {slot.subjects.name}
                                        </p>
                                        <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                                            {slot.room && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={12} /> {slot.room}
                                                </span>
                                            )}
                                            {slot.section && (
                                                <Badge variant="outline" className="text-xs">
                                                    Section {slot.section}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {(isCurrentSlot(slot) || isUpcoming(slot)) && (
                                    <Button
                                        size="sm"
                                        onClick={() => handleStartSession(slot)}
                                        className="gap-2"
                                    >
                                        <Play size={14} />
                                        Start Session
                                    </Button>
                                )}
                            </div>
                        ))}

                        {/* Free slots */}
                        {todayFreeSlots.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                <p className="text-sm font-medium text-neutral-500 mb-2">Free Periods</p>
                                <div className="flex flex-wrap gap-2">
                                    {todayFreeSlots.map((free, idx) => (
                                        <Badge key={idx} variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                            <Coffee size={12} className="mr-1" />
                                            {free.start.slice(0, 5)} - {free.end.slice(0, 5)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* Full Week View */}
            <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Full Week</h2>
                <div className="grid gap-4">
                    {DAYS.slice(1, 7).map((day, idx) => {
                        const dayIndex = idx + 1; // Monday = 1, ..., Saturday = 6
                        const daySlots = slotsByDay[dayIndex] || [];
                        const isToday = dayIndex === today;

                        return (
                            <Card
                                key={day}
                                className={cn(
                                    "p-4",
                                    isToday && "ring-2 ring-blue-500"
                                )}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                        {day}
                                        {isToday && <Badge className="ml-2" variant="default">Today</Badge>}
                                    </h3>
                                    <span className="text-sm text-neutral-500">{daySlots.length} classes</span>
                                </div>
                                {daySlots.length === 0 ? (
                                    <p className="text-sm text-neutral-400">No classes</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {daySlots.map((slot) => (
                                            <Badge
                                                key={slot.id}
                                                variant="outline"
                                                className="py-1 px-2"
                                            >
                                                <Clock size={10} className="mr-1" />
                                                {slot.start_time.slice(0, 5)} - {slot.subjects.code}
                                                {slot.room && ` (${slot.room})`}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

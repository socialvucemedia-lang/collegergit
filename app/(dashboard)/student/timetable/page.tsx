"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, Loader2, Calendar, Coffee, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface TimetableSlot {
    id: string;
    subject_id: string;
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
    teachers: {
        id: string;
        employee_id: string;
        users: { full_name: string } | { full_name: string }[];
    } | null;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StudentTimetablePage() {
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState<{ section: string | null; semester: number | null }>({
        section: null,
        semester: null,
    });

    const today = new Date().getDay();
    const currentTime = new Date().toTimeString().slice(0, 5);

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Get student info (section, semester)
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('section, semester')
                .eq('user_id', session.user.id)
                .single();

            if (studentError || !student) {
                console.error("Student profile not found");
                setLoading(false);
                return;
            }

            setStudentInfo({ section: student.section, semester: student.semester });

            // Fetch timetable for student's section and semester
            let query = supabase
                .from('timetable_slots')
                .select(`
                    *,
                    subjects (
                        id,
                        code,
                        name
                    ),
                    teachers (
                        id,
                        employee_id,
                        users (
                            full_name
                        )
                    )
                `)
                .order('day_of_week', { ascending: true })
                .order('start_time', { ascending: true });

            if (student.section) {
                query = query.eq('section', student.section);
            }
            if (student.semester) {
                query = query.eq('semester', student.semester);
            }

            const { data, error } = await query;
            if (error) throw error;

            setSlots(data || []);
        } catch (error) {
            console.error("Error fetching timetable:", error);
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

    const getTeacherName = (teacher: TimetableSlot['teachers']) => {
        if (!teacher) return "TBA";
        const users = teacher.users;
        if (Array.isArray(users)) {
            return users[0]?.full_name || teacher.employee_id;
        }
        return users?.full_name || teacher.employee_id;
    };

    const isCurrentSlot = (slot: TimetableSlot) => {
        return slot.day_of_week === today &&
            slot.start_time <= currentTime &&
            slot.end_time > currentTime;
    };

    const isUpcoming = (slot: TimetableSlot) => {
        return slot.day_of_week === today && slot.start_time > currentTime;
    };

    const isPast = (slot: TimetableSlot) => {
        return slot.day_of_week === today && slot.end_time <= currentTime;
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-neutral-400" size={32} />
            </div>
        );
    }

    const todaySlots = slotsByDay[today] || [];

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">My Timetable</h1>
                    <p className="text-neutral-500">
                        {studentInfo.section ? `Section ${studentInfo.section}` : ''}
                        {studentInfo.semester ? ` • Semester ${studentInfo.semester}` : ''}
                    </p>
                </div>
            </div>

            {/* Today's Schedule */}
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
                        <p>No classes scheduled for today!</p>
                    </div>
                ) : (
                    <div className="relative pl-6 border-l border-neutral-200 dark:border-neutral-800 space-y-6">
                        {todaySlots.map((slot) => (
                            <div key={slot.id} className="relative">
                                {/* Timeline Dot */}
                                <div className={cn(
                                    "absolute -left-[29px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-neutral-950",
                                    isCurrentSlot(slot) ? "bg-green-500 animate-pulse" :
                                        isUpcoming(slot) ? "bg-blue-400" :
                                            "bg-neutral-300 dark:bg-neutral-700"
                                )} />

                                <div className={cn(
                                    "p-4 rounded-xl border transition-all",
                                    isCurrentSlot(slot)
                                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                        : isUpcoming(slot)
                                            ? "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                                            : "bg-neutral-50 dark:bg-neutral-800/50 border-transparent opacity-60"
                                )}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                                                {slot.subjects.code} - {slot.subjects.name}
                                            </h3>
                                            <p className="text-sm text-neutral-500">{getTeacherName(slot.teachers)}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-sm font-medium font-mono text-neutral-600 dark:text-neutral-400">
                                                {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                            </span>
                                            {isCurrentSlot(slot) && (
                                                <Badge className="bg-green-500">Now</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-neutral-400 font-medium uppercase tracking-wide">
                                        {slot.room && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={12} />
                                                {slot.room}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} />
                                            1h
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Full Week View */}
            <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Full Week</h2>
                <div className="grid gap-4">
                    {DAYS.slice(1, 7).map((day, idx) => {
                        const dayIndex = idx + 1;
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
                                                <BookOpen size={10} className="mr-1" />
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

import { createServerClient } from '@/lib/supabase-server';
import { verifyServerAuth } from '@/lib/server-auth';
import { Card } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, CalendarDays, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ClassSession {
    id: string;
    subject_code: string;
    subject_name: string;
    start_time: string;
    end_time: string;
    room: string;
    day_of_week: string;
    division: string;
    semester: number;
    student_count?: number;
    is_current?: boolean;
}

async function getTeacherClasses(userId: string) {
    const supabase = await createServerClient();

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/teacher/classes`, {
        headers: {
            'x-user-id': userId,
        },
        cache: 'no-store'
    });

    if (!response.ok) {
        return { schedule: [] };
    }

    return response.json();
}

function formatTime(time: string) {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

export default async function TeacherDashboard() {
    const { user, profile } = await verifyServerAuth('teacher');

    // Fetch classes directly on server
    const supabase = await createServerClient();

    // Get current day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    // Fetch teacher's allocations with timetable
    const { data: allocations, error } = await supabase
        .from('allocations')
        .select(`
            id,
            subject_id,
            division,
            semester,
            subjects!inner(id, code, name),
            timetable_entries(id, day_of_week, start_time, end_time, room)
        `)
        .eq('teacher_id', user.id);

    // Transform data for today's schedule
    const schedule: ClassSession[] = [];

    if (allocations) {
        for (const alloc of allocations) {
            const entries = (alloc.timetable_entries || []) as any[];
            const todayEntries = entries.filter((e: any) => e.day_of_week === today);

            for (const entry of todayEntries) {
                const isCurrent = entry.start_time <= currentTime && entry.end_time > currentTime;

                schedule.push({
                    id: entry.id,
                    subject_code: (alloc.subjects as any).code,
                    subject_name: (alloc.subjects as any).name,
                    start_time: entry.start_time,
                    end_time: entry.end_time,
                    room: entry.room || 'TBA',
                    day_of_week: entry.day_of_week,
                    division: alloc.division || '',
                    semester: alloc.semester,
                    is_current: isCurrent,
                });
            }
        }
    }

    // Sort by start time
    schedule.sort((a, b) => a.start_time.localeCompare(b.start_time));

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                    Today's Classes
                </h1>
                <p className="text-neutral-500">
                    {today}, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Schedule */}
            {schedule.length === 0 ? (
                <Card className="p-8 text-center">
                    <CalendarDays className="mx-auto mb-3 text-neutral-400" size={40} />
                    <p className="text-neutral-500">No classes scheduled for today</p>
                    <Link
                        href="/teacher/timetable"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 mt-2 hover:underline"
                    >
                        View Full Timetable <ChevronRight size={14} />
                    </Link>
                </Card>
            ) : (
                <div className="space-y-3">
                    {schedule.map((cls) => (
                        <Link key={cls.id} href={`/teacher/attendance/new?class=${cls.id}`}>
                            <Card className={`p-4 transition-all hover:shadow-md cursor-pointer ${cls.is_current
                                    ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                                    : ''
                                }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                            {cls.subject_code}
                                        </h3>
                                        <p className="text-sm text-neutral-500">{cls.subject_name}</p>
                                    </div>
                                    {cls.is_current && (
                                        <Badge className="bg-blue-500 text-white">Now</Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-sm text-neutral-500 mt-3">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin size={14} />
                                        {cls.room}
                                    </span>
                                    {cls.division && (
                                        <span className="flex items-center gap-1">
                                            <Users size={14} />
                                            Div {cls.division}
                                        </span>
                                    )}
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

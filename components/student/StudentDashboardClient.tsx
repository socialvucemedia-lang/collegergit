'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';

type ViewType = 'today' | 'timetable' | 'profile';

interface TimelineItem {
    id: string;
    subject_code: string;
    subject_name: string;
    start_time: string;
    end_time: string;
    room: string;
    teacher_name: string;
    status: 'completed' | 'current' | 'upcoming';
    attendance_status: 'present' | 'absent' | 'late' | null;
}

interface AttendanceData {
    overall: { total_classes: number; attended: number; percentage: number };
    subjects: Array<{
        subject_id: string;
        subject_code: string;
        subject_name: string;
        percentage: number;
        total: number;
        present: number;
    }>;
}

interface DayInfo {
    date: string;
    day_name: string;
}

interface StudentDashboardProps {
    timeline: TimelineItem[];
    dayInfo: DayInfo | null;
    attendance: AttendanceData | null;
}

const VIEWS: { id: ViewType; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'timetable', label: 'Timetable' },
    { id: 'profile', label: 'Profile' },
];

export function StudentDashboardClient({ timeline, dayInfo, attendance }: StudentDashboardProps) {
    const [activeView, setActiveView] = useState<ViewType>('today');

    return (
        <div className="space-y-6">
            {/* Tab Selector */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2 border-b border-neutral-100 dark:border-neutral-800">
                {VIEWS.map((view) => {
                    const isActive = view.id === activeView;
                    return (
                        <button
                            key={view.id}
                            onClick={() => setActiveView(view.id)}
                            className={`relative px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'
                                }`}
                        >
                            {view.label}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white rounded-full"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeView}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeView === 'today' && <TodayView timeline={timeline} dayInfo={dayInfo} />}
                    {activeView === 'timetable' && <TimetableView />}
                    {activeView === 'profile' && <ProfileView data={attendance} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function TodayView({ timeline, dayInfo }: { timeline: TimelineItem[]; dayInfo: DayInfo | null }) {
    const getStatusInfo = (attendanceStatus: string | null, slotStatus: string) => {
        if (slotStatus === 'completed') {
            if (attendanceStatus === 'present') return { color: 'bg-green-500', text: 'Present', textColor: 'text-green-600 dark:text-green-400' };
            if (attendanceStatus === 'late') return { color: 'bg-yellow-500', text: 'Late', textColor: 'text-yellow-600 dark:text-yellow-400' };
            if (attendanceStatus === 'absent') return { color: 'bg-red-500', text: 'Absent', textColor: 'text-red-600 dark:text-red-400' };
            return { color: 'bg-neutral-400', text: 'Pending', textColor: 'text-neutral-400' };
        }
        if (slotStatus === 'current') return { color: 'bg-blue-500', text: 'Ongoing', textColor: 'text-blue-600 dark:text-blue-400' };
        return { color: 'bg-neutral-300 dark:bg-neutral-700', text: 'Upcoming', textColor: 'text-neutral-400' };
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Timeline</h2>
                {dayInfo && (
                    <span className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                        {dayInfo.day_name}, {new Date(dayInfo.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </span>
                )}
            </div>

            {timeline.length === 0 ? (
                <Card className="p-8 text-center">
                    <Calendar className="mx-auto mb-3 text-neutral-400" size={40} />
                    <p className="text-neutral-500">No classes scheduled for today</p>
                </Card>
            ) : (
                <div className="relative pl-4 space-y-6 border-l border-neutral-200 dark:border-neutral-800 ml-2">
                    {timeline.map((item, idx) => {
                        const statusInfo = getStatusInfo(item.attendance_status, item.status);
                        return (
                            <div key={item.id || idx} className="relative">
                                <div className={`absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-black ${statusInfo.color}`} />
                                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                            {item.subject_code} - {item.subject_name}
                                        </h3>
                                        <span className={`text-xs font-bold ${statusInfo.textColor}`}>{statusInfo.text}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                        </span>
                                        {item.room && (
                                            <span className="flex items-center gap-1">
                                                <MapPin size={14} />
                                                {item.room}
                                            </span>
                                        )}
                                    </div>
                                    {item.teacher_name && (
                                        <p className="text-xs text-neutral-400 mt-2">{item.teacher_name}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function TimetableView() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Weekly Schedule</h2>
            </div>
            <Card className="p-8 text-center">
                <Calendar className="mx-auto mb-3 text-neutral-400" size={40} />
                <p className="text-neutral-500 mb-4">View your complete weekly timetable</p>
                <Link
                    href="/student/timetable"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    <Calendar size={16} />
                    View Timetable
                </Link>
            </Card>
        </div>
    );
}

function ProfileView({ data }: { data: AttendanceData | null }) {
    const getStatusColor = (percentage: number) => {
        if (percentage >= 85) return 'border-l-green-500';
        if (percentage >= 75) return 'border-l-yellow-500';
        return 'border-l-red-500';
    };

    const getStatusBadge = (percentage: number) => {
        if (percentage >= 75) return { text: 'Compliant', class: 'bg-white/20 text-white hover:bg-white/30 dark:bg-black/10 dark:text-black dark:hover:bg-black/20' };
        return { text: 'Defaulter', class: 'bg-red-500/20 text-red-100 hover:bg-red-500/30' };
    };

    if (!data) {
        return (
            <div className="text-center py-20 text-neutral-400">
                No attendance data found.
            </div>
        );
    }

    const badge = getStatusBadge(data.overall.percentage);

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-neutral-900 text-white dark:bg-white dark:text-black">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm opacity-80 mb-1">Overall Attendance</p>
                        <h2 className="text-4xl font-bold">{data.overall.percentage}%</h2>
                    </div>
                    <Badge className={`${badge.class} border-none`}>
                        {badge.text}
                    </Badge>
                </div>
                <div className="mt-4 h-2 bg-white/20 dark:bg-black/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white dark:bg-black transition-all" style={{ width: `${data.overall.percentage}%` }} />
                </div>
                <p className="text-xs opacity-60 mt-2">
                    {data.overall.attended} / {data.overall.total_classes} classes attended
                </p>
            </Card>

            <div className="grid grid-cols-2 gap-3">
                {data.subjects.map((subject) => (
                    <Card key={subject.subject_id} className={`p-4 border-l-4 ${getStatusColor(subject.percentage)}`}>
                        <p className="text-xs text-neutral-500 mb-1 truncate">{subject.subject_name}</p>
                        <p className="text-xl font-bold">{subject.percentage}%</p>
                        <p className="text-xs text-neutral-400">{subject.present}/{subject.total}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
}

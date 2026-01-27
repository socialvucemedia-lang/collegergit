"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ViewType = "today" | "timetable" | "profile";

export default function StudentDashboard() {
    const [activeView, setActiveView] = useState<ViewType>("today");

    const VIEWS: { id: ViewType; label: string }[] = [
        { id: "today", label: "Today" },
        { id: "timetable", label: "Timetable" },
        { id: "profile", label: "Profile" },
    ];

    return (
        <div className="space-y-6">
            {/* Instagram-style Selector Bar - Horizontal Scrollable if needed, but here fixed width */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2 border-b border-neutral-100 dark:border-neutral-800">
                {VIEWS.map((view) => {
                    const isActive = view.id === activeView;
                    return (
                        <button
                            key={view.id}
                            onClick={() => setActiveView(view.id)}
                            className={`relative px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-500"
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
                    {activeView === "today" && <TodayView />}
                    {activeView === "timetable" && <TimetableView />}
                    {activeView === "profile" && <ProfileView />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function TodayView() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Timeline</h2>
                <span className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">24 Oct</span>
            </div>

            <div className="relative pl-4 space-y-8 border-l border-neutral-200 dark:border-neutral-800 ml-2">
                {/* Timeline Setup */}
                {[
                    { time: "08:30 AM", subject: "Engineering Graphics (EG)", status: "Present", color: "text-green-600 dark:text-green-400" },
                    { time: "09:30 AM", subject: "AM-II", status: "Present", color: "text-green-600 dark:text-green-400" },
                    { time: "10:30 AM", subject: "Data Structures (DS - B2)", status: "Present", color: "text-green-600 dark:text-green-400" },
                    { time: "11:30 AM", subject: "EC/EP", status: "Upcoming", color: "text-neutral-400" },
                ].map((item, idx) => (
                    <div key={idx} className="relative">
                        <div className={`absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-black ${item.status === 'Present' ? 'bg-green-500' :
                            item.status === 'Absent' ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-700'
                            }`} />
                        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{item.subject}</h3>
                                <span className={`text-xs font-bold ${item.color}`}>{item.status}</span>
                            </div>
                            <p className="text-sm text-neutral-500">{item.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function TimetableView() {
    return (
        <div className="text-center py-20 text-neutral-400">
            Timetable View Placeholder
        </div>
    )
}

function ProfileView() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        overall: { total_classes: number; attended: number; percentage: number };
        subjects: Array<{
            subject_id: string;
            subject_code: string;
            subject_name: string;
            percentage: number;
            total: number;
            present: number;
        }>;
    } | null>(null);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const response = await fetch('/api/student/attendance');
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (percentage: number) => {
        if (percentage >= 85) return 'border-l-green-500';
        if (percentage >= 75) return 'border-l-yellow-500';
        return 'border-l-red-500';
    };

    const getStatusBadge = (percentage: number) => {
        if (percentage >= 75) return { text: 'Compliant', class: 'bg-white/20 text-white hover:bg-white/30 dark:bg-black/10 dark:text-black dark:hover:bg-black/20' };
        return { text: 'Defaulter', class: 'bg-red-500/20 text-red-100 hover:bg-red-500/30' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-white"></div>
            </div>
        );
    }

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
    )
}

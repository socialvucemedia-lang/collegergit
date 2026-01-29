
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, X, Clock, Save, Loader2, Smartphone, LayoutList, RotateCcw, ChevronLeft, ChevronRight, Search, ChevronUp, ChevronDown, Monitor, CheckCircle } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Status = "present" | "absent" | "late" | "excused";
type ViewMode = "list" | "swipe" | null;

interface StudentRecord {
    student_id: string;
    record_id?: string;
    name: string;
    roll_number: string;
    email: string;
    status: Status | null;
}

interface SessionDetails {
    id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    subjects: {
        name: string;
        code: string;
    };
}

interface HistoryAction {
    index: number;
    studentId: string;
    previousStatus: Status | null;
}

export default function MarkAttendancePage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [session, setSession] = useState<SessionDetails | null>(null);
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // View Mode & Persistence
    const [viewMode, setViewMode] = useState<ViewMode>(null);

    // Swipe Mode State
    const [currentReelIndex, setCurrentReelIndex] = useState(0);
    const [dragDirection, setDragDirection] = useState<'up' | 'down' | null>(null);
    const [history, setHistory] = useState<HistoryAction[]>([]);

    // List View Search
    const [searchQuery, setSearchQuery] = useState("");

    // Stats
    const [stats, setStats] = useState({ present: 0, absent: 0, total: 0 });

    useEffect(() => {
        // Load preference
        const savedMode = localStorage.getItem("attendanceViewMode") as ViewMode;
        if (savedMode === "list" || savedMode === "swipe") {
            setViewMode(savedMode);
        }
        fetchData();
    }, [sessionId]);

    useEffect(() => {
        const total = students.length;
        const present = students.filter(s => s.status === 'present').length;
        const absent = students.filter(s => s.status === 'absent').length;
        setStats({ present, absent, total });
    }, [students]);

    const setMode = (mode: "list" | "swipe") => {
        setViewMode(mode);
        localStorage.setItem("attendanceViewMode", mode);
    };

    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return students;
        const query = searchQuery.toLowerCase();
        return students.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.roll_number.toLowerCase().includes(query) ||
            s.email.toLowerCase().includes(query)
        );
    }, [students, searchQuery]);

    const fetchData = async () => {
        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const response = await fetch(`/api/teacher/sessions/${sessionId}/attendance`, {
                headers: {
                    Authorization: `Bearer ${currentSession?.access_token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to load data");

            const data = await response.json();
            setSession(data.session);
            setStudents(data.students || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load attendance session");
        } finally {
            setLoading(false);
        }
    };

    const markStudent = (studentId: string, status: Status) => {
        setStudents(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, status } : s
        ));
    };

    const markAll = (status: Status) => {
        setStudents(prev => prev.map(s => ({ ...s, status })));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const unmarked = students.filter(s => !s.status);
            if (unmarked.length > 0) {
                toast.warning(`${unmarked.length} students are unmarked. They will be ignored.`);
            }

            const payload = {
                records: students
                    .filter(s => s.status)
                    .map(s => ({
                        student_id: s.student_id,
                        status: s.status
                    }))
            };

            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const response = await fetch(`/api/teacher/sessions/${sessionId}/attendance`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentSession?.access_token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success("Attendance saved successfully!");
            router.push("/teacher/attendance");
        } catch (error) {
            toast.error("Failed to save attendance");
        } finally {
            setSaving(false);
        }
    };

    // --- SWIPE MODE LOGIC ---

    const nextReel = () => {
        if (currentReelIndex < students.length - 1) {
            setCurrentReelIndex(prev => prev + 1);
        } else {
            toast.success("All students marked!");
        }
    };

    const prevReel = () => {
        if (currentReelIndex > 0) {
            setCurrentReelIndex(prev => prev - 1);
        }
    };

    const markInReel = (studentId: string, status: Status) => {
        const student = students.find(s => s.student_id === studentId);
        if (!student) return;

        // Push to history
        setHistory(prev => [...prev, {
            index: currentReelIndex,
            studentId,
            previousStatus: student.status
        }]);

        markStudent(studentId, status);

        // Brief delay before scrolling to next
        setTimeout(() => {
            nextReel();
        }, 200);
    };

    const undoReelAction = () => {
        if (history.length === 0) return;

        const lastAction = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));

        // Restore student status
        setStudents(prev => prev.map(s =>
            s.student_id === lastAction.studentId
                ? { ...s, status: lastAction.previousStatus }
                : s
        ));

        // Restore index
        setCurrentReelIndex(lastAction.index);
    };

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 80;
        const student = students[currentReelIndex];

        if (info.offset.y < -threshold) {
            markInReel(student.student_id, 'present');
        } else if (info.offset.y > threshold) {
            markInReel(student.student_id, 'absent');
        }
        setDragDirection(null);
    };

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y < -30) setDragDirection('up');
        else if (info.offset.y > 30) setDragDirection('down');
        else setDragDirection(null);
    };

    // --- RENDER ---

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!session) {
        return <div className="text-center py-12">Session not found</div>;
    }

    // 1. MODE SELECTOR (If no mode selected)
    if (!viewMode) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-neutral-950 p-4">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tighter">Mark Attendance</h1>
                        <p className="text-neutral-500">Choose your preferred way to mark attendance.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => setMode('swipe')}
                            className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all"
                        >
                            <div className="p-4 bg-white dark:bg-neutral-950 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                <Smartphone size={32} className="text-blue-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">Swipe Mode</h3>
                                <p className="text-sm text-neutral-500">Best for mobile. Swipe up/down to mark.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('list')}
                            className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all"
                        >
                            <div className="p-4 bg-white dark:bg-neutral-950 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                <LayoutList size={32} className="text-purple-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">List Mode</h3>
                                <p className="text-sm text-neutral-500">Traditional list view. Best for desktop/tablets.</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 pb-24 sm:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                            <ArrowLeft size={18} />
                        </Button>
                        <div>
                            <h1 className="font-bold text-lg leading-tight truncate max-w-[200px] sm:max-w-none">
                                {session.subjects.code}
                            </h1>
                            <p className="text-xs text-neutral-500">
                                {viewMode === 'swipe' ? 'Swipe Mode' : 'List Mode'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:block text-right mr-2">
                            <div className="text-sm font-medium">
                                {stats.present} / {stats.total}
                            </div>
                        </div>
                        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            <span className="hidden sm:inline">Save</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Mode Toggle Checkbox/Switcher - Discrete visual */}
            <div className="max-w-5xl mx-auto px-4 py-4 flex justify-end">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode(viewMode === 'list' ? 'swipe' : 'list')}
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                >
                    Switch to {viewMode === 'list' ? 'Swipe Mode' : 'List Mode'}
                </Button>
            </div>

            <main className="max-w-5xl mx-auto px-4">
                {viewMode === 'swipe' ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                        {/* Swipe Hint */}
                        <div className="flex items-center gap-6 text-sm text-neutral-400 font-medium">
                            <span className={cn(dragDirection === 'up' && "text-green-500 scale-110 transition-all")}>
                                <ChevronUp className="inline mr-1" size={16} /> Up for Present
                            </span>
                            <span className={cn(dragDirection === 'down' && "text-red-500 scale-110 transition-all")}>
                                <ChevronDown className="inline mr-1" size={16} /> Down for Absent
                            </span>
                        </div>

                        <div className="relative w-full max-w-sm h-[55dvh] max-h-[500px]">
                            <AnimatePresence mode="wait">
                                {students.length > 0 && currentReelIndex < students.length ? (
                                    <motion.div
                                        key={students[currentReelIndex].student_id}
                                        drag="y"
                                        dragConstraints={{ top: 0, bottom: 0 }}
                                        dragElastic={0.7}
                                        onDrag={handleDrag}
                                        onDragEnd={handleDragEnd}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            y: 0,
                                            backgroundColor: dragDirection === 'up'
                                                ? 'rgba(34, 197, 94, 0.05)'
                                                : dragDirection === 'down'
                                                    ? 'rgba(239, 68, 68, 0.05)'
                                                    : 'rgba(255, 255, 255, 1)' // Default white/bg
                                        }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        className={cn(
                                            "absolute inset-0 cursor-grab active:cursor-grabbing rounded-3xl border-2 shadow-2xl flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-neutral-900",
                                            dragDirection === 'up' ? "border-green-400" :
                                                dragDirection === 'down' ? "border-red-400" :
                                                    "border-neutral-200 dark:border-neutral-800"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-inner",
                                            students[currentReelIndex].status === 'present' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                students[currentReelIndex].status === 'absent' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                                        )}>
                                            {students[currentReelIndex].roll_number.slice(-3)}
                                        </div>

                                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                                            {students[currentReelIndex].name}
                                        </h2>
                                        <p className="text-neutral-500 mb-6">
                                            Roll No: {students[currentReelIndex].roll_number}
                                        </p>

                                        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                                            <span>{currentReelIndex + 1}</span>
                                            <span>/</span>
                                            <span>{students.length}</span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-neutral-50 dark:bg-neutral-900 rounded-3xl shadow-inner"
                                    >
                                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
                                            <CheckCircle size={40} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">All Done!</h3>
                                        <p className="text-neutral-500 max-w-[200px]">You've marked attendance for all students.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Controls */}
                        <div className="w-full max-w-sm grid grid-cols-4 gap-3">
                            {/* Undo Button */}
                            <Button
                                variant="outline"
                                className="h-14 rounded-2xl flex-col gap-1 border-neutral-200 dark:border-neutral-800"
                                onClick={undoReelAction}
                                disabled={history.length === 0}
                            >
                                <RotateCcw size={18} />
                                <span className="text-[10px]">Undo</span>
                            </Button>

                            {/* Absent Button */}
                            <Button
                                className="col-span-1 h-14 rounded-2xl bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 border border-transparent dark:border-red-900"
                                onClick={() => markInReel(students[currentReelIndex].student_id, 'absent')}
                                disabled={currentReelIndex >= students.length}
                            >
                                <X size={24} />
                            </Button>

                            {/* Present Button - Larger */}
                            <Button
                                className="col-span-2 h-14 rounded-2xl bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                                onClick={() => markInReel(students[currentReelIndex].student_id, 'present')}
                                disabled={currentReelIndex >= students.length}
                            >
                                <Check size={24} />
                                <span className="ml-2">Present</span>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    placeholder="Search student..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                                />
                            </div>
                            <Button variant="outline" onClick={() => markAll('present')} className="w-full sm:w-auto">
                                Mark All Present
                            </Button>
                        </div>

                        {filteredStudents.length === 0 ? (
                            <div className="text-center py-12 text-neutral-500">
                                {searchQuery ? "No students match your search" : "No students found"}
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredStudents.map((student, index) => (
                                    <motion.div
                                        key={student.student_id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={cn(
                                            "flex flex-col p-3 rounded-xl border transition-all text-left",
                                            student.status === 'present' ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900" :
                                                student.status === 'absent' ? "bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900" :
                                                    "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                                                    student.status === 'present' ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                                                        student.status === 'absent' ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                                                            "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                                                )}>
                                                    {student.roll_number.slice(-3)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">{student.name}</h3>
                                                    <p className="text-xs text-neutral-500">{student.roll_number}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mt-auto">
                                            <StatusButton
                                                active={student.status === 'present'}
                                                onClick={() => markStudent(student.student_id, 'present')}
                                                color="green"
                                                icon={Check}
                                                label="Present"
                                            />
                                            <StatusButton
                                                active={student.status === 'absent'}
                                                onClick={() => markStudent(student.student_id, 'absent')}
                                                color="red"
                                                icon={X}
                                                label="Absent"
                                            />
                                            <StatusButton
                                                active={student.status === 'late'}
                                                onClick={() => markStudent(student.student_id, 'late')}
                                                color="orange"
                                                icon={Clock}
                                                label="Late"
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function StatusButton({ active, onClick, color, icon: Icon, label }: any) {
    const activeClasses = {
        green: "bg-green-500 text-white border-green-600 dark:bg-green-600 dark:border-green-500",
        red: "bg-red-500 text-white border-red-600 dark:bg-red-600 dark:border-red-500",
        orange: "bg-orange-500 text-white border-orange-600 dark:bg-orange-600 dark:border-orange-500",
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium border transition-all active:scale-95",
                active
                    ? activeClasses[color as keyof typeof activeClasses]
                    : "bg-white dark:bg-neutral-950 text-neutral-500 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            )}
            title={label}
        >
            <Icon size={16} />
            <span className={cn("hidden lg:inline", active && "inline")}>{label}</span>
        </button>
    );
}

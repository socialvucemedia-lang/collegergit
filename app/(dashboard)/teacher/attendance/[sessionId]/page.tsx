
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, X, Clock, HelpCircle, Save, Loader2, CheckCircle2, LayoutList, Smartphone, ChevronLeft, ChevronRight, Search, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Status = "present" | "absent" | "late" | "excused";

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

export default function MarkAttendancePage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [session, setSession] = useState<SessionDetails | null>(null);
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Reels Mode state
    const [reelsMode, setReelsMode] = useState(false);
    const [currentReelIndex, setCurrentReelIndex] = useState(0);
    const [dragDirection, setDragDirection] = useState<'up' | 'down' | null>(null);

    // List View Search
    const [searchQuery, setSearchQuery] = useState("");

    // Stats
    const [stats, setStats] = useState({ present: 0, absent: 0, total: 0 });

    useEffect(() => {
        fetchData();
    }, [sessionId]);

    useEffect(() => {
        const total = students.length;
        const present = students.filter(s => s.status === 'present').length;
        const absent = students.filter(s => s.status === 'absent').length;
        setStats({ present, absent, total });
    }, [students]);

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

    const markStudent = async (studentId: string, status: Status) => {
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

    const handleQuickUpdate = async (student: StudentRecord, newStatus: Status) => {
        if (!student.record_id) return;

        setStudents(prev => prev.map(s =>
            s.student_id === student.student_id ? { ...s, status: newStatus } : s
        ));

        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const response = await fetch(`/api/teacher/sessions/${sessionId}/attendance/edit`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentSession?.access_token}`,
                },
                body: JSON.stringify({
                    record_id: student.record_id,
                    status: newStatus
                }),
            });

            if (!response.ok) {
                setStudents(prev => prev.map(s =>
                    s.student_id === student.student_id ? { ...s, status: student.status } : s
                ));
                throw new Error("Failed to update");
            }
            toast.success("Updated");
        } catch (error) {
            toast.error("Failed to update record");
        }
    };

    const nextReel = () => {
        if (currentReelIndex < students.length - 1) {
            setCurrentReelIndex(prev => prev + 1);
        }
    };

    const prevReel = () => {
        if (currentReelIndex > 0) {
            setCurrentReelIndex(prev => prev - 1);
        }
    };

    const markInReel = async (studentId: string, status: Status) => {
        markStudent(studentId, status);
        setTimeout(() => {
            nextReel();
        }, 300);
    };

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 80;
        const student = students[currentReelIndex];

        if (info.offset.y < -threshold) {
            // Swipe UP = Present
            markInReel(student.student_id, 'present');
        } else if (info.offset.y > threshold) {
            // Swipe DOWN = Absent
            markInReel(student.student_id, 'absent');
        }
        setDragDirection(null);
    };

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y < -30) {
            setDragDirection('up');
        } else if (info.offset.y > 30) {
            setDragDirection('down');
        } else {
            setDragDirection(null);
        }
    };

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!session) {
        return <div className="text-center py-12">Session not found</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft size={18} />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400">
                        {session.subjects.name}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                        <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-800 dark:text-neutral-200">
                            {session.subjects.code}
                        </span>
                        <span>•</span>
                        <span>{new Date(session.session_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {stats.present}/{stats.total} Present
                        </div>
                        <div className="text-xs text-neutral-500">
                            {Math.round((stats.present / (stats.total || 1)) * 100)}% Attendance
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[120px]">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save
                    </Button>
                </div>
            </div>

            {/* Actions & Toggle */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg flex">
                    <button
                        onClick={() => setReelsMode(false)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            !reelsMode ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100" : "text-neutral-500"
                        )}
                    >
                        <LayoutList size={16} />
                        List View
                    </button>
                    <button
                        onClick={() => setReelsMode(true)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            reelsMode ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100" : "text-neutral-500"
                        )}
                    >
                        <Smartphone size={16} />
                        Swipe Mode
                    </button>
                </div>
                {!reelsMode && (
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <Input
                                placeholder="Search by name or roll..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-64"
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => markAll('present')}>
                            Mark All Present
                        </Button>
                    </div>
                )}
            </div>

            {reelsMode ? (
                <div className="flex flex-col items-center justify-center min-h-[500px] gap-8">
                    {/* Swipe Hint */}
                    <div className="flex items-center gap-6 text-sm text-neutral-400">
                        <div className={cn(
                            "flex items-center gap-2 transition-all",
                            dragDirection === 'up' && "text-green-500 scale-110"
                        )}>
                            <ChevronUp size={20} />
                            Swipe Up = Present
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 transition-all",
                            dragDirection === 'down' && "text-red-500 scale-110"
                        )}>
                            <ChevronDown size={20} />
                            Swipe Down = Absent
                        </div>
                    </div>

                    <div className="relative w-full max-w-sm h-[400px]">
                        <AnimatePresence mode="wait">
                            {students.length > 0 && (
                                <motion.div
                                    key={students[currentReelIndex].student_id}
                                    drag="y"
                                    dragConstraints={{ top: 0, bottom: 0 }}
                                    dragElastic={0.7}
                                    onDrag={handleDrag}
                                    onDragEnd={handleDragEnd}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        backgroundColor: dragDirection === 'up'
                                            ? 'rgba(34, 197, 94, 0.1)'
                                            : dragDirection === 'down'
                                                ? 'rgba(239, 68, 68, 0.1)'
                                                : 'transparent'
                                    }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 cursor-grab active:cursor-grabbing"
                                >
                                    <Card className={cn(
                                        "h-full p-8 flex flex-col items-center justify-center text-center gap-6 shadow-xl border-2 transition-colors select-none",
                                        students[currentReelIndex].status === 'present' ? "border-green-500 bg-green-50/50 dark:bg-green-900/10" :
                                            students[currentReelIndex].status === 'absent' ? "border-red-500 bg-red-50/50 dark:bg-red-900/10" :
                                                dragDirection === 'up' ? "border-green-400" :
                                                    dragDirection === 'down' ? "border-red-400" :
                                                        "border-neutral-200 dark:border-neutral-800"
                                    )}>
                                        <div className={cn(
                                            "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg transition-colors",
                                            students[currentReelIndex].status === 'present' ? "bg-green-500 text-white" :
                                                students[currentReelIndex].status === 'absent' ? "bg-red-500 text-white" :
                                                    dragDirection === 'up' ? "bg-green-400 text-white" :
                                                        dragDirection === 'down' ? "bg-red-400 text-white" :
                                                            "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                                        )}>
                                            {students[currentReelIndex].roll_number.slice(-3)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                                                {students[currentReelIndex].name}
                                            </h2>
                                            <p className="text-neutral-500">
                                                Roll No: {students[currentReelIndex].roll_number}
                                            </p>
                                        </div>

                                        <div className="text-sm font-medium text-neutral-400">
                                            {currentReelIndex + 1} of {students.length} Students
                                        </div>

                                        {students[currentReelIndex].status && (
                                            <div className={cn(
                                                "px-4 py-2 rounded-full font-semibold",
                                                students[currentReelIndex].status === 'present'
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            )}>
                                                {students[currentReelIndex].status === 'present' ? 'Marked Present' : 'Marked Absent'}
                                            </div>
                                        )}
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col gap-6 w-full max-w-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                size="lg"
                                className="h-16 text-lg font-bold rounded-2xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                                onClick={() => markInReel(students[currentReelIndex].student_id, 'absent')}
                            >
                                <X size={24} className="mr-2" />
                                Absent
                            </Button>
                            <Button
                                size="lg"
                                className="h-16 text-lg font-bold rounded-2xl bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
                                onClick={() => markInReel(students[currentReelIndex].student_id, 'present')}
                            >
                                <Check size={24} className="mr-2" />
                                Present
                            </Button>
                        </div>

                        <div className="flex justify-between items-center px-2">
                            <Button
                                variant="ghost"
                                disabled={currentReelIndex === 0}
                                onClick={prevReel}
                                className="gap-2"
                            >
                                <ChevronLeft size={20} />
                                Previous
                            </Button>
                            <Button
                                variant="ghost"
                                disabled={currentReelIndex === students.length - 1}
                                onClick={nextReel}
                                className="gap-2"
                            >
                                Next
                                <ChevronRight size={20} />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500">
                            {searchQuery ? "No students match your search" : "No students found for this session"}
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredStudents.map((student) => (
                                <Card key={student.student_id} className={cn(
                                    "p-4 flex items-center justify-between transition-all",
                                    student.status === 'present' ? "border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900" :
                                        student.status === 'absent' ? "border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900" :
                                            "hover:border-neutral-300 dark:hover:border-neutral-700"
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                                            student.status === 'present' ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                                                student.status === 'absent' ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                                                    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                                        )}>
                                            {student.roll_number}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{student.name}</h3>
                                            <p className="text-sm text-neutral-500">{student.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                                        <StatusButton
                                            active={student.status === 'present'}
                                            onClick={() => student.record_id ? handleQuickUpdate(student, 'present') : markStudent(student.student_id, 'present')}
                                            color="green"
                                            icon={Check}
                                            label="Present"
                                        />
                                        <StatusButton
                                            active={student.status === 'absent'}
                                            onClick={() => student.record_id ? handleQuickUpdate(student, 'absent') : markStudent(student.student_id, 'absent')}
                                            color="red"
                                            icon={X}
                                            label="Absent"
                                        />
                                        <StatusButton
                                            active={student.status === 'late'}
                                            onClick={() => student.record_id ? handleQuickUpdate(student, 'late') : markStudent(student.student_id, 'late')}
                                            color="orange"
                                            icon={Clock}
                                            label="Late"
                                        />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatusButton({ active, onClick, color, icon: Icon, label }: any) {
    const activeClasses = {
        green: "bg-white text-green-700 shadow-sm dark:bg-green-900 dark:text-green-100",
        red: "bg-white text-red-700 shadow-sm dark:bg-red-900 dark:text-red-100",
        orange: "bg-white text-orange-700 shadow-sm dark:bg-orange-900 dark:text-orange-100",
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "p-2 rounded-md transition-all flex items-center gap-2 px-3 text-sm font-medium",
                active ? activeClasses[color as keyof typeof activeClasses] : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400"
            )}
            title={label}
        >
            <Icon size={16} />
            <span className={cn("hidden sm:inline", !active && "hidden")}>{label}</span>
        </button>
    );
}

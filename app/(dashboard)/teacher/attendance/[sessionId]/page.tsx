
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
    attendance_percentage?: number;
    total_lectures?: number;
    present_lectures?: number;
}

interface SessionDetails {
    id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    section?: string;
    batch?: string;
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
            const { data, error: authError } = await supabase.auth.getSession();
            if (authError || !data.session) {
                console.error("Auth error:", authError);
                toast.error("Session expired. Please login again.");
                router.replace("/login?redirect=" + encodeURIComponent(window.location.pathname));
                return;
            }

            const response = await fetch(`/api/teacher/sessions/${sessionId}/attendance`, {
                headers: {
                    Authorization: `Bearer ${data.session.access_token}`,
                },
            });
            if (!response.ok) {
                if (response.status === 401) {
                    toast.error("Unauthorized. Please login again.");
                    router.replace("/login?redirect=" + encodeURIComponent(window.location.pathname));
                    return;
                }
                throw new Error("Failed to load data");
            }

            const resData = await response.json();
            setSession(resData.session);
            setStudents(resData.students || []);
        } catch (error: any) {
            console.error(error);
            if (error.message?.includes("Refresh Token")) {
                toast.error("Session expired. Please login again.");
                router.replace("/login?redirect=" + encodeURIComponent(window.location.pathname));
            } else {
                toast.error("Failed to load attendance session");
            }
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

    const handleSave = async (studentsData?: StudentRecord[]) => {
        setSaving(true);
        const currentStudents = studentsData || students;

        try {
            const unmarked = currentStudents.filter(s => !s.status);
            if (unmarked.length > 0) {
                toast.warning(`${unmarked.length} students are unmarked. They will be ignored.`);
            }

            const payload = {
                records: currentStudents
                    .filter(s => s.status)
                    .map(s => ({
                        student_id: s.student_id,
                        status: s.status
                    }))
            };

            const { data, error: authError } = await supabase.auth.getSession();

            if (authError || !data.session) {
                toast.error("Session expired. Please login again.");
                router.push("/login");
                return;
            }

            // Add timeout signal (15 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            try {
                const response = await fetch(`/api/teacher/sessions/${sessionId}/attendance`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${data.session.access_token}`,
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        toast.error("Unauthorized. Please login again.");
                        router.push("/login");
                        return;
                    }
                    throw new Error("Failed to save");
                }

                toast.success("Attendance saved successfully!");
                router.push("/teacher/attendance");
            } finally {
                clearTimeout(timeoutId);
            }
        } catch (error: any) {
            console.error(error);
            if (error.name === 'AbortError') {
                toast.error("Request timed out. Please try again.");
            } else if (error.message?.includes("Refresh Token")) {
                toast.error("Session expired. Please login again.");
                router.push("/login");
            } else {
                toast.error("Failed to save attendance");
            }
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

        // Clone current students to reflect the new change immediately for auto-save check
        const updatedStudents = students.map(s =>
            s.student_id === studentId ? { ...s, status } : s
        );

        // Push to history
        setHistory(prev => [...prev, {
            index: currentReelIndex,
            studentId,
            previousStatus: student.status
        }]);

        markStudent(studentId, status);

        // Check if this was the last student
        if (currentReelIndex >= students.length - 1) {
            toast.info("Auto-saving attendance...");
            handleSave(updatedStudents); // Pass updated data immediately
        } else {
            // Brief delay before scrolling to next
            setTimeout(() => {
                nextReel();
            }, 150);
        }
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
        const threshold = 100; // Increased threshold for better control
        const student = students[currentReelIndex];

        if (info.offset.y < -threshold) {
            markInReel(student.student_id, 'present');
        } else if (info.offset.y > threshold) {
            markInReel(student.student_id, 'absent');
        }
        setDragDirection(null);
    };

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y < -40) setDragDirection('up');
        else if (info.offset.y > 40) setDragDirection('down');
        else setDragDirection(null);
    };

    // --- RENDER ---

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-neutral-400" size={32} /></div>;
    }

    if (!session) {
        return <div className="text-center py-12">Session not found</div>;
    }

    // 1. MODE SELECTOR (If no mode selected)
    if (!viewMode) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tighter text-neutral-900 dark:text-white">Mark Attendance</h1>
                        <p className="text-neutral-500">Choose your preferred way to mark attendance.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => setMode('swipe')}
                            className="group relative flex flex-col items-center gap-4 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl hover:scale-[1.02] transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative p-5 bg-blue-50 dark:bg-blue-900/10 rounded-full shadow-sm">
                                <Smartphone size={32} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="relative space-y-1">
                                <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">Swipe Mode</h3>
                                <p className="text-sm text-neutral-500">Fast & Intuitive. Swipe cards to mark.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('list')}
                            className="group relative flex flex-col items-center gap-4 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl hover:scale-[1.02] transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-neutral-500/5 to-neutral-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative p-5 bg-purple-50 dark:bg-purple-900/10 rounded-full shadow-sm">
                                <LayoutList size={32} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="relative space-y-1">
                                <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">List Mode</h3>
                                <p className="text-sm text-neutral-500">Classic view. Search & edit easily.</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-black pb-24 sm:pb-8 selection:bg-neutral-200 dark:selection:bg-neutral-800">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full">
                            <ArrowLeft size={18} />
                        </Button>
                        <div>
                            <h1 className="font-bold text-lg leading-tight text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
                                {session.subjects.code}
                                {session.section && <span className="ml-2 text-sm font-medium text-blue-600 dark:text-blue-400">• Div {session.section}</span>}
                            </h1>
                            <p className="text-xs font-medium text-neutral-500">
                                {viewMode === 'swipe' ? <span className="flex items-center gap-1"><Smartphone size={10} /> Swipe Mode</span> : <span className="flex items-center gap-1"><LayoutList size={10} /> List Mode</span>}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Summary Stats (Hidden on small screens if space needed) */}
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                                {stats.present} / {stats.total}
                            </div>
                            <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Present</div>
                        </div>

                        {/* Switch Mode Button (Mobile optimized) */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode(viewMode === 'list' ? 'swipe' : 'list')}
                            className="hidden sm:flex text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                        >
                            {viewMode === 'list' ? 'Swipe Mode' : 'List Mode'}
                        </Button>

                        {/* Mobile Icon Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMode(viewMode === 'list' ? 'swipe' : 'list')}
                            className="flex sm:hidden text-neutral-500"
                        >
                            {viewMode === 'list' ? <Smartphone size={18} /> : <LayoutList size={18} />}
                        </Button>

                        <Button onClick={() => handleSave()} disabled={saving} size="sm" className={cn("gap-2 rounded-full font-medium transition-all shadow-md active:scale-95", saving && "opacity-80")}>
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
                        </Button>
                    </div>
                </div>
            </header>



            <main className="max-w-5xl mx-auto px-4 pt-4">
                {viewMode === 'swipe' ? (
                    <div className="flex flex-col items-center justify-start sm:justify-center min-h-[calc(100vh-5rem)] relative overflow-hidden touch-none select-none pb-20">
                        {/* Background Decor */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                            <div className="w-[80vw] h-[80vw] bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
                        </div>

                        {/* Swipe Indicators */}
                        <div className="absolute top-[5%] flex flex-col items-center gap-2 pointer-events-none transition-opacity duration-300 z-0" style={{ opacity: dragDirection === 'up' ? 1 : 0.2 }}>
                            <div className="p-3 bg-green-500/10 rounded-full backdrop-blur-md">
                                <ChevronUp className="text-green-500" size={32} />
                            </div>
                            <span className="text-sm font-bold text-green-500 uppercase tracking-widest">Present</span>
                        </div>

                        <div className="absolute bottom-[10%] flex flex-col items-center gap-2 pointer-events-none transition-opacity duration-300 z-0" style={{ opacity: dragDirection === 'down' ? 1 : 0.2 }}>
                            <span className="text-sm font-bold text-red-500 uppercase tracking-widest">Absent</span>
                            <div className="p-3 bg-red-500/10 rounded-full backdrop-blur-md">
                                <ChevronDown className="text-red-500" size={32} />
                            </div>
                        </div>

                        {/* Card Container - Centered */}
                        <div className="relative w-full max-w-[340px] md:max-w-[380px] h-[60vh] max-h-[550px] min-h-[400px] z-20 flex items-center justify-center mt-4">
                            <AnimatePresence mode="popLayout">
                                {students.length > 0 && currentReelIndex < students.length ? (
                                    <motion.div
                                        key={students[currentReelIndex].student_id}
                                        drag="y"
                                        dragConstraints={{ top: 0, bottom: 0 }}
                                        dragElastic={0.7}
                                        onDrag={handleDrag}
                                        onDragEnd={handleDragEnd}
                                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            y: 0,
                                            rotate: dragDirection === 'up' ? -2 : dragDirection === 'down' ? 2 : 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.95,
                                            y: dragDirection === 'up' ? -300 : 300,
                                            transition: { duration: 0.2 }
                                        }}
                                        className={cn(
                                            "absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing rounded-[2rem] shadow-2xl flex flex-col overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 touch-pan-y",
                                            dragDirection === 'up' && "ring-4 ring-green-500/30 border-green-500 transition-all shadow-green-500/20",
                                            dragDirection === 'down' && "ring-4 ring-red-500/30 border-red-500 transition-all shadow-red-500/20"
                                        )}
                                    >
                                        {/* Card Header / Banner */}
                                        <div className="h-[140px] min-h-[140px] bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 relative">
                                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-neutral-100 dark:border-neutral-800">
                                                {currentReelIndex + 1} / {students.length}
                                            </div>
                                        </div>

                                        {/* Avatar & Content */}
                                        <div className="flex-1 flex flex-col items-center px-6 pb-6 -mt-[60px]">
                                            <div className="relative mb-4 group shrink-0">
                                                {/* Progress Ring for Attendance */}
                                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 rotate-45 group-hover:rotate-180 transition-transform duration-700 opacity-80"></div>

                                                <div className={cn(
                                                    "w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-white dark:border-neutral-900 relative z-10",
                                                    students[currentReelIndex].status === 'present' ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                                                        students[currentReelIndex].status === 'absent' ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                                                            "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                                )}>
                                                    {students[currentReelIndex].roll_number.slice(-3)}
                                                </div>

                                                {/* Percentage Badge */}
                                                <div className={cn(
                                                    "absolute -bottom-2 -right-2 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border border-white dark:border-neutral-800 z-20 flex items-center gap-1",
                                                    (students[currentReelIndex].attendance_percentage || 0) < 75 ? "bg-red-50 text-red-600 dark:bg-red-900/50 dark:text-red-200" : "bg-green-50 text-green-600 dark:bg-green-900/50 dark:text-green-200"

                                                )}>
                                                    {students[currentReelIndex].attendance_percentage ?? 0}%
                                                </div>
                                            </div>

                                            <div className="flex-1 w-full flex flex-col items-center justify-center space-y-2 min-h-0">
                                                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white text-center leading-tight line-clamp-2">
                                                    {students[currentReelIndex].name}
                                                </h2>
                                                <p className="text-neutral-500 font-medium text-sm bg-neutral-100 dark:bg-neutral-800 px-4 py-1.5 rounded-full shrink-0">
                                                    Roll No: {students[currentReelIndex].roll_number}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 w-full mt-4 shrink-0">
                                                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                                                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-0.5">Total</div>
                                                    <div className="text-xl font-bold text-neutral-900 dark:text-white leading-none">{students[currentReelIndex].total_lectures || 0}</div>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                                                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-0.5">Present</div>
                                                    <div className="text-xl font-bold text-neutral-900 dark:text-white leading-none">{students[currentReelIndex].present_lectures || 0}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-neutral-900 rounded-[2rem] shadow-xl border border-neutral-200 dark:border-neutral-800"
                                    >
                                        <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4 text-green-500 animate-bounce-slow">
                                            <CheckCircle size={48} strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Session Compete!</h3>
                                        <p className="text-neutral-500 mb-6 text-sm">Here is the summary for today.</p>

                                        {/* Summary Stats */}
                                        <div className="grid grid-cols-2 gap-3 w-full mb-6 max-w-[280px]">
                                            <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30">
                                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</span>
                                                <span className="text-xs font-semibold text-green-600/70 dark:text-green-400/70 uppercase">Present</span>
                                            </div>
                                            <div className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                                                <span className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</span>
                                                <span className="text-xs font-semibold text-red-600/70 dark:text-red-400/70 uppercase">Absent</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 w-full max-w-[280px]">
                                            <Button onClick={() => handleSave()} disabled={saving} className="w-full rounded-xl h-12 text-base font-semibold shadow-md gap-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black">
                                                {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                                {saving ? 'Saving...' : 'Save Attendance'}
                                            </Button>
                                            <Button onClick={() => router.push('/teacher/attendance')} variant="ghost" className="w-full rounded-xl h-10 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
                                                Back to Dashboard
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Progress Bar - Moved to top to avoid overlap with cards */}
                        <div className="absolute top-[8%] left-8 right-8 h-1.5 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-full overflow-hidden backdrop-blur-sm z-10 pointer-events-none">
                            <motion.div
                                className="h-full bg-neutral-900 dark:bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                animate={{ width: `${Math.min(((currentReelIndex) / students.length) * 100, 100)}%` }}
                            />
                        </div>

                        {/* Controls - Bottom fixed */}
                        <div className="absolute bottom-6 w-full max-w-[340px] grid grid-cols-4 gap-4 px-4 z-30">
                            <Button
                                variant="outline"
                                className="h-14 w-14 rounded-full border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md hover:bg-neutral-100 dark:hover:bg-neutral-800 p-0 flex items-center justify-center shadow-lg"
                                onClick={undoReelAction}
                                disabled={history.length === 0 || (students.length > 0 && currentReelIndex >= students.length)}
                            >
                                <RotateCcw size={20} className="text-neutral-500" />
                            </Button>

                            <Button
                                className="col-span-1 h-14 w-14 rounded-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 border-0 p-0 flex items-center justify-center shadow-lg shadow-red-500/10"
                                onClick={() => markInReel(students[currentReelIndex].student_id, 'absent')}
                                disabled={currentReelIndex >= students.length}
                            >
                                <X size={28} />
                            </Button>

                            <Button
                                className="col-span-2 h-14 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-xl shadow-neutral-900/20 dark:shadow-white/10 p-0 flex items-center justify-center gap-2"
                                onClick={() => markInReel(students[currentReelIndex].student_id, 'present')}
                                disabled={currentReelIndex >= students.length}
                            >
                                <Check size={24} />
                                <span className="font-semibold text-lg">Present</span>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    placeholder="Search student by name or roll number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-11 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm focus-visible:ring-1 focus-visible:ring-neutral-950"
                                />
                            </div>
                            <Button variant="outline" onClick={() => markAll('present')} className="w-full sm:w-auto h-11 rounded-xl border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium">
                                <CheckCircle size={18} className="mr-2 text-green-500" /> Mark All Present
                            </Button>
                        </div>

                        {filteredStudents.length === 0 ? (
                            <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                                    <Search size={24} className="text-neutral-400" />
                                </div>
                                <p className="text-neutral-500 font-medium">
                                    {searchQuery ? "No students match your search" : "No students found in this class"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredStudents.map((student, index) => (
                                    <motion.div
                                        key={student.student_id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={cn(
                                            "flex flex-col p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group hover:shadow-md",
                                            student.status === 'present' ? "bg-green-50/40 border-green-200 dark:bg-green-900/10 dark:border-green-900/50" :
                                                student.status === 'absent' ? "bg-red-50/40 border-red-200 dark:bg-red-900/10 dark:border-red-900/50" :
                                                    "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                                        )}
                                    >
                                        {/* Top Status Indicator Line */}
                                        <div className={cn(
                                            "absolute top-0 left-0 w-full h-1 transition-colors",
                                            student.status === 'present' ? "bg-green-500" :
                                                student.status === 'absent' ? "bg-red-500" :
                                                    student.status === 'late' ? "bg-orange-500" :
                                                        "bg-transparent"
                                        )} />

                                        <div className="flex items-start justify-between mb-4 gap-2">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-12 h-12 flex-shrink-0">
                                                    <div className={cn(
                                                        "w-full h-full rounded-full flex items-center justify-center font-bold text-sm shadow-sm border-2 border-white dark:border-neutral-800",
                                                        student.status === 'present' ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                                                            student.status === 'absent' ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                                                                "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                                                    )}>
                                                        {student.roll_number.slice(-3)}
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base truncate">{student.name}</h3>
                                                    <p className="text-xs text-neutral-500 font-medium truncate">{student.roll_number}</p>
                                                </div>
                                            </div>

                                            {/* Attendance % Badge */}
                                            <div className={cn(
                                                "px-2 py-1 rounded-md text-[10px] font-bold border",
                                                (student.attendance_percentage || 0) < 75
                                                    ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30"
                                                    : "bg-green-50 text-green-600 border-green-100 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30"
                                            )}>
                                                {student.attendance_percentage ?? 0}%
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-auto">
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
                                            {/* <StatusButton
                                                active={student.status === 'late'}
                                                onClick={() => markStudent(student.student_id, 'late')}
                                                color="orange"
                                                icon={Clock}
                                                label="Late"
                                            /> */}
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

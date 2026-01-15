"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Share2, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentCard from "./StudentCard";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import studentData from "@/data/students.json";
import { Student } from "@/types/student";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AttendanceSession({ sessionId }: { sessionId: string }) {
    const router = useRouter();
    const [students] = useState(() => (studentData as Student[]).map(s => ({
        ...s,
        rollNumber: s.rollNumber.toString(),
        // Fix hydration error: Make attendance rate deterministic based on roll number if missing
        attendanceRate: s.attendanceRate || (parseInt(s.rollNumber.toString().replace(/\D/g, '') || '0') % 30) + 70
    })));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [markedHistory, setMarkedHistory] = useState<{ id: string; status: 'present' | 'absent' }[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    const currentStudent = students[currentIndex];
    const progress = (currentIndex / students.length) * 100;

    const handleMark = (status: 'present' | 'absent') => {
        // Add to history
        setMarkedHistory(prev => [...prev, { id: currentStudent.id, status }]);

        // Move to next
        if (currentIndex < students.length - 1) {
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 400); // Wait for animation to clear
        } else {
            setTimeout(() => {
                setIsComplete(true);
            }, 400);
        }
    };

    const handleUndo = () => {
        if (currentIndex > 0) {
            const lastMark = markedHistory[markedHistory.length - 1];
            setMarkedHistory(prev => prev.slice(0, -1));
            setCurrentIndex(prev => prev - 1);
            toast("Undone: " + lastMark.status.toUpperCase());
        }
    };

    if (isComplete) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] px-6 text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle size={40} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-500">Session Complete</h2>
                    <p className="text-neutral-500 mt-2">All {students.length} students have been marked.</p>
                </div>

                <div className="w-full max-w-xs space-y-3 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg">
                    <div className="flex justify-between text-sm">
                        <span>Present</span>
                        <span className="font-bold text-green-600">{markedHistory.filter(m => m.status === 'present').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Absent</span>
                        <span className="font-bold text-red-600">{markedHistory.filter(m => m.status === 'absent').length}</span>
                    </div>
                </div>

                <Button onClick={() => router.push('/teacher')} className="w-full max-w-xs" size="lg">
                    Submit & Finish
                </Button>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-neutral-950 overflow-hidden flex flex-col pt-safe pb-safe">
            {/* Dynamic Background Gradient */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{
                        opacity: [0.1, 0.2, 0.1],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[120px]"
                />
                <motion.div
                    animate={{
                        opacity: [0.1, 0.2, 0.1],
                        scale: [1.1, 1, 1.1]
                    }}
                    transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                    className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 blur-[120px]"
                />
            </div>

            {/* Glass Header */}
            <header className="relative z-50 flex items-center justify-between p-4 bg-white/40 dark:bg-neutral-950/40 backdrop-blur-xl border-b border-white/20 dark:border-neutral-800/20">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50">
                    <ArrowLeft size={22} />
                </Button>
                <div className="text-center">
                    <h3 className="font-bold text-sm tracking-tight text-neutral-900 dark:text-neutral-100 uppercase">
                        Attendance
                    </h3>
                    <div className="flex -space-x-1 justify-center mt-1">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 border border-white dark:border-neutral-900" />
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleUndo}
                        disabled={currentIndex === 0}
                        className="rounded-full hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-500 disabled:opacity-30"
                    >
                        <RotateCcw size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50">
                        <Share2 size={20} />
                    </Button>
                </div>
            </header>

            {/* Layout Container */}
            <div className="flex-1 flex flex-col relative">
                {/* Immersive Progress Bar (Top) */}
                <div className="px-6 pt-6 pb-2">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-600 uppercase tracking-widest">Progress</span>
                        <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-full">
                            {currentIndex + 1} / {students.length}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: "spring", stiffness: 50, damping: 20 }}
                            className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full"
                        />
                    </div>
                </div>

                {/* Main Interaction Area (Card Stack) */}
                <div className="flex-1 relative flex items-center justify-center p-6 sm:p-8">
                    {/* Ghost Card (Background) */}
                    {currentIndex < students.length - 1 && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-full max-w-[320px] aspect-[3/4.5] bg-neutral-50 dark:bg-neutral-900/50 rounded-[44px] border border-neutral-100 dark:border-neutral-800/50 scale-[0.92] opacity-50 z-0 pointer-events-none" />
                    )}

                    <AnimatePresence mode="popLayout">
                        <StudentCard
                            key={currentStudent.id}
                            student={currentStudent}
                            isActive={true}
                            onMark={handleMark}
                        />
                    </AnimatePresence>
                </div>

                {/* Bottom Reachable Controls */}
                <footer className="p-6 pb-12 sm:pb-8 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-200/20 backdrop-blur-sm">
                        <Users size={12} className="text-neutral-400" />
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">
                            {markedHistory.length} Marked this session
                        </span>
                    </div>
                </footer>
            </div>
        </div>
    );
}

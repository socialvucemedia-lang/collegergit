"use client";

import { motion, PanInfo, useAnimation, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface Student {
    id: string;
    name: string;
    rollNumber: string;
    avatar?: string;
    attendanceRate: number; // 0-100
}

interface StudentCardProps {
    student: Student;
    onMark: (status: 'present' | 'absent') => void;
    isActive: boolean;
}

export default function StudentCard({ student, onMark, isActive }: StudentCardProps) {
    const controls = useAnimation();
    const y = useMotionValue(0);
    const opacity = useTransform(y, [0, -200], [1, 0]);
    const scale = useTransform(y, [0, -200], [1, 0.9]);

    // Feedback indicators
    const [feedback, setFeedback] = useState<'present' | 'absent' | null>(null);

    // Reset card state when student changes
    useEffect(() => {
        y.set(0);
        // setFeedback is not needed because component remounts with key change
        controls.start({ y: 0, opacity: 1, scale: 1 });
    }, [student.id, controls, y]);


    const handleDragEnd = async (_: never, info: PanInfo) => {
        const threshold = 100; // Drag threshold

        if (info.offset.y < -threshold) {
            // SWIPE UP -> PRESENT
            setFeedback('present');
            await controls.start({ y: -500, opacity: 0, transition: { duration: 0.2 } });
            onMark('present');
        } else if (info.offset.y > threshold) {
            // SWIPE DOWN -> ABSENT
            setFeedback('absent');
            await controls.start({ y: 500, opacity: 0, transition: { duration: 0.2 } }); // Drop down
            onMark('absent');
        } else {
            // Snap back
            controls.start({ y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
        }
    };

    // Double tap removed in favor of Swipe Down

    if (!isActive) return null;

    return (
        <div className="relative w-full max-w-[320px] aspect-[3/4.5] flex items-center justify-center select-none z-10">
            {/* Ambient Card Shadow layer */}
            <div className="absolute inset-8 bg-neutral-900/10 dark:bg-white/5 rounded-[44px] blur-3xl opacity-60" />

            {/* Swipe Indicators (Status Feedback) */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: feedback === 'present' ? 40 : -40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`absolute z-[60] px-8 py-4 rounded-[32px] backdrop-blur-3xl border shadow-2xl flex flex-col items-center gap-2 ${feedback === 'present'
                            ? 'top-0 bg-green-500 text-white border-green-400'
                            : 'bottom-0 bg-red-500 text-white border-red-400'
                            }`}
                    >
                        {feedback === 'present' ? (
                            <>
                                <CheckCircle2 className="w-10 h-10" />
                                <span className="text-xs font-black tracking-[0.3em] uppercase">Present</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-10 h-10" />
                                <span className="text-xs font-black tracking-[0.3em] uppercase">Absent</span>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                drag="y"
                dragConstraints={{ top: -500, bottom: 500 }}
                dragElastic={0.6}
                onDragEnd={handleDragEnd}
                animate={controls}
                whileTap={{ scale: 0.98 }}
                style={{ y, opacity, scale, touchAction: "none" }}
                className="w-full h-full bg-white dark:bg-neutral-900 rounded-[44px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-neutral-100/80 dark:border-neutral-800/80 overflow-hidden relative"
            >
                {/* Visual Header Pattern */}
                <div className="h-[40%] bg-neutral-50 dark:bg-neutral-800/30 relative flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.02)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.01)_1px,transparent_0)] [background-size:20px_20px]" />

                    <div className="relative">
                        <div className="absolute -inset-4 bg-neutral-900/5 dark:bg-white/5 rounded-full blur-2xl" />
                        <Avatar className="w-28 h-28 border-[6px] border-white dark:border-neutral-900 shadow-xl relative z-10 transition-transform active:scale-105">
                            {/* <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}&backgroundColor=f1f5f9,e2e8f0&fontSize=32&fontWeight=800`} /> */}
                            <AvatarFallback className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black tracking-tight border-4 border-white dark:border-neutral-900">
                                {student.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                {/* Student Info Area */}
                <div className="px-8 flex-1 flex flex-col justify-between py-6">
                    <div className="space-y-4">
                        <div className="space-y-0.5 text-center">
                            <h2 className="text-3xl font-black text-neutral-900 dark:text-neutral-50 leading-tight tracking-tight uppercase">
                                {student.name.split(' ')[1]}
                            </h2>
                            <p className="text-neutral-400 dark:text-neutral-500 font-bold text-xs uppercase tracking-wider">
                                {student.name.split(' ')[0]} {student.name.split(' ').slice(2).join(' ')}
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <div className="px-3 py-1 rounded-full bg-neutral-900 dark:bg-neutral-100 text-[10px] font-black text-white dark:text-neutral-900 uppercase tracking-widest">
                                Roll {student.rollNumber}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Attendance</span>
                                <div className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tabular-nums">
                                    {student.attendanceRate}%
                                </div>
                            </div>
                            <div className="space-y-1 text-right">
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Trend</span>
                                <div className="text-sm font-bold text-green-600 dark:text-green-500 flex items-center justify-end gap-1">
                                    Stable
                                </div>
                            </div>
                        </div>

                        {/* Hint Bar */}
                        <div className="flex gap-1 h-0.5 opacity-20">
                            <div className="flex-1 bg-green-500 rounded-full" />
                            <div className="flex-1 bg-red-500 rounded-full" />
                            <div className="flex-1 bg-neutral-400 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Subtle Drag Handle */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            </motion.div>
        </div>
    );
}

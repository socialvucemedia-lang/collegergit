"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface SubjectStats {
    subject_id: string;
    subject_code: string;
    subject_name: string;
    semester: number | null;
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
}

interface AttendanceData {
    student: {
        id: string;
        roll_number: string;
        semester: number;
    };
    overall: {
        total_classes: number;
        attended: number;
        percentage: number;
    };
    subjects: SubjectStats[];
}

export default function AttendanceHistoryPage() {
    const [data, setData] = useState<AttendanceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/student/attendance", {
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                },
            });
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (percentage: number) => {
        if (percentage >= 75) return 'good';
        if (percentage >= 60) return 'warning';
        return 'critical';
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-neutral-400" size={32} />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12 text-neutral-500">
                <AlertCircle className="mx-auto mb-2" size={32} />
                <p>Unable to load attendance data</p>
            </div>
        );
    }

    const { overall, subjects } = data;

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Attendance History</h1>
                <p className="text-neutral-500">Detailed breakdown by subject</p>
            </div>

            {/* Overall Stats */}
            <Card className={cn(
                "p-6 border-2",
                overall.percentage >= 75 ? "border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800" :
                    overall.percentage >= 60 ? "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-800" :
                        "border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800"
            )}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Overall Attendance</h2>
                        <p className="text-sm text-neutral-500">
                            {overall.attended} / {overall.total_classes} classes attended
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={cn(
                            "text-4xl font-bold",
                            overall.percentage >= 75 ? "text-green-600" :
                                overall.percentage >= 60 ? "text-yellow-600" : "text-red-600"
                        )}>
                            {overall.percentage}%
                        </div>
                        <Badge variant={overall.percentage >= 75 ? "default" : overall.percentage >= 60 ? "secondary" : "destructive"}>
                            {overall.percentage >= 75 ? "Good Standing" : overall.percentage >= 60 ? "Warning" : "At Risk"}
                        </Badge>
                    </div>
                </div>
                <Progress
                    value={overall.percentage}
                    className={cn(
                        "h-3",
                        overall.percentage >= 75 ? "[&>div]:bg-green-500" :
                            overall.percentage >= 60 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
                    )}
                />
            </Card>

            {/* Subject-wise Stats */}
            <div className="grid gap-4">
                {subjects.length === 0 ? (
                    <Card className="p-8 text-center text-neutral-500">
                        <p>No attendance records found yet.</p>
                    </Card>
                ) : (
                    subjects.map((sub) => {
                        const status = getStatus(sub.percentage);
                        return (
                            <Card key={sub.subject_id} className="p-4 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                            {sub.subject_code} - {sub.subject_name}
                                        </h3>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {sub.present + sub.late} / {sub.total} Sessions •
                                            {sub.late > 0 && ` ${sub.late} late`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "text-xl font-bold",
                                            status === 'critical' ? 'text-red-500' :
                                                status === 'warning' ? 'text-yellow-500' : 'text-green-600'
                                        )}>
                                            {sub.percentage}%
                                        </div>
                                        {status === 'critical' && (
                                            <TrendingDown className="text-red-500" size={16} />
                                        )}
                                        {status === 'good' && (
                                            <TrendingUp className="text-green-500" size={16} />
                                        )}
                                    </div>
                                </div>
                                <Progress
                                    value={sub.percentage}
                                    className={cn(
                                        "h-2",
                                        status === 'critical' ? '[&>div]:bg-red-500' :
                                            status === 'warning' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'
                                    )}
                                />
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}

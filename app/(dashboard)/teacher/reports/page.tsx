"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface SubjectStat {
    subject_id: string;
    subject_code: string;
    subject_name: string;
    semester: number | null;
    department: string | null;
    total_sessions: number;
    avg_attendance: number | null;
    students_below_threshold: number;
    total_students: number;
}

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState<SubjectStat[]>([]);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/teacher/reports", {
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSubjects(data.subjects || []);
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const getProgressColor = (percentage: number | null) => {
        if (percentage === null) return "";
        if (percentage >= 85) return "[&>div]:bg-green-500";
        if (percentage >= 75) return "[&>div]:bg-yellow-500";
        return "[&>div]:bg-red-500";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-neutral-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Reports & Analytics</h1>
                    <p className="text-neutral-500">Subject-wise performance summary</p>
                </div>
                <Button onClick={fetchReports} variant="outline" size="sm" className="gap-2">
                    <RefreshCw size={14} />
                    Refresh
                </Button>
            </div>

            {subjects.length === 0 ? (
                <Card className="p-12 text-center">
                    <FileText className="mx-auto mb-4 text-neutral-400" size={48} />
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No Subjects Assigned</h3>
                    <p className="text-neutral-500 mt-2">You don't have any subjects assigned yet.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {subjects.map((sub) => (
                        <Card key={sub.subject_id} className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                                        {sub.subject_code} - {sub.subject_name}
                                    </h3>
                                    <p className="text-xs text-neutral-500">
                                        {sub.total_sessions} Sessions • {sub.total_students} Students
                                        {sub.department && ` • ${sub.department}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                        {sub.avg_attendance !== null ? `${sub.avg_attendance}%` : 'N/A'}
                                    </p>
                                    <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Avg. Attendance</p>
                                </div>
                            </div>

                            <Progress
                                value={sub.avg_attendance ?? 0}
                                className={`h-1.5 mb-4 ${getProgressColor(sub.avg_attendance)}`}
                            />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-md">
                                    <AlertCircle size={14} />
                                    <span className="text-xs font-bold">{sub.students_below_threshold} Below 75%</span>
                                </div>
                                {sub.semester && (
                                    <span className="text-xs text-neutral-500">Sem {sub.semester}</span>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

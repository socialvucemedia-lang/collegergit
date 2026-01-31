"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Check, X, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface HistoryRecord {
    session_id: string;
    date: string;
    time: string;
    subject_code: string;
    subject_name: string;
    status: string | null;
    marked_at: string | null;
}

export default function SubjectHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const subjectId = params.subjectId as string;
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [subjectInfo, setSubjectInfo] = useState<{ code: string; name: string } | null>(null);

    useEffect(() => {
        fetchHistory();
    }, [subjectId]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            // First get the student ID
            const studentRes = await fetch('/api/student/attendance');
            if (!studentRes.ok) throw new Error('Failed to get student info');
            const studentData = await studentRes.json();

            // Then get subject history
            const response = await fetch(
                `/api/student/attendance/history?subject_id=${subjectId}&student_id=${studentData.student.id}`
            );
            if (response.ok) {
                const data = await response.json();
                setHistory(data.history || []);
                if (data.history?.length > 0) {
                    setSubjectInfo({
                        code: data.history[0].subject_code,
                        name: data.history[0].subject_name,
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching history:", error);
            toast.error("Failed to load attendance history");
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: history.length,
        present: history.filter(h => h.status === 'present' || h.status === 'late').length,
        absent: history.filter(h => h.status === 'absent').length,
    };
    const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {subjectInfo?.code || 'Subject'} Attendance
                    </h1>
                    <p className="text-neutral-500">{subjectInfo?.name || 'Loading...'}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                    <p className="text-sm text-neutral-500">Total Classes</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </Card>
                <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-600 dark:text-green-400">Present</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.present}</p>
                </Card>
                <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">Absent</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.absent}</p>
                </Card>
                <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-400">Percentage</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{percentage}%</p>
                </Card>
            </div>

            {/* History List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-neutral-400" size={32} />
                </div>
            ) : history.length === 0 ? (
                <Card className="p-12 text-center">
                    <Calendar className="mx-auto text-neutral-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium">No attendance records</h3>
                    <p className="text-neutral-500 mt-2">No classes have been conducted yet.</p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {history.map((record) => (
                        <Card key={record.session_id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${record.status === 'present' || record.status === 'late'
                                        ? 'bg-green-100 text-green-600'
                                        : record.status === 'absent'
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-neutral-100 text-neutral-400'
                                    }`}>
                                    {record.status === 'present' || record.status === 'late' ? (
                                        <Check size={20} />
                                    ) : record.status === 'absent' ? (
                                        <X size={20} />
                                    ) : (
                                        <Clock size={20} />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium">
                                        {new Date(record.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-sm text-neutral-500">
                                        {record.time?.slice(0, 5)}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${record.status === 'present'
                                    ? 'bg-green-100 text-green-700'
                                    : record.status === 'late'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : record.status === 'absent'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-neutral-100 text-neutral-500'
                                }`}>
                                {record.status || 'Not Marked'}
                            </span>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

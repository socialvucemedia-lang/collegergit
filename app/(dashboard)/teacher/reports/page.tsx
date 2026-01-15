"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, FileText } from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
    const subjects = [
        { id: 'eg', name: "Engineering Graphics (EG)", avgAttendance: 84, defaulters: 5 },
        { id: 'am2', name: "AM-II", avgAttendance: 79, defaulters: 8 },
        { id: 'ds', name: "Data Structures (DS)", avgAttendance: 91, defaulters: 2 },
        { id: 'ep', name: "Engineering Physics (EP)", avgAttendance: 88, defaulters: 3 },
    ];

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Reports & Analytics</h1>
                <p className="text-neutral-500">Subject-wise performance summary</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {subjects.map((sub) => (
                    <Card key={sub.id} className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{sub.name}</h3>
                                <p className="text-xs text-neutral-500">3 Batches • 180 Students</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{sub.avgAttendance}%</p>
                                <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Avg. Attendance</p>
                            </div>
                        </div>

                        <Progress value={sub.avgAttendance} className="h-1.5 mb-4" />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-md">
                                <AlertCircle size={14} />
                                <span className="text-xs font-bold">{sub.defaulters} Defaulters</span>
                            </div>
                            <Link href="/teacher/reports/export" className="flex items-center text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
                                <FileText size={14} className="mr-1.5" />
                                Export CSV
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

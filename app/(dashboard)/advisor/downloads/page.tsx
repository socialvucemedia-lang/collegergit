"use client";

import { Download, FileText, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Student } from "@/types/student";
import studentData from "@/data/students.json";
import { useMemo } from "react";

export default function DownloadsPage() {
    // 1. Enrich student data with mock attendance (consistent with risks page)
    const enrichedStudents = useMemo(() => {
        return (studentData as Student[]).map(s => {
            const attendance = s.attendanceRate || (Math.floor(Math.sin(Number(s.rollNumber)) * 20) + 70);
            return {
                ...s,
                attendance,
                batch: getBatch(Number(s.rollNumber))
            };
        });
    }, []);

    function getBatch(roll: number) {
        if (roll >= 201 && roll <= 220) return "B1";
        if (roll >= 221 && roll <= 240) return "B2";
        if (roll >= 241) return "B3";
        return "Unknown";
    }

    // 2. CSV Generation Logic
    const downloadCSV = (filename: string, data: any[]) => {
        const headers = ["Roll Number", "Name", "Batch", "Attendance %", "Status"];
        const csvContent = [
            headers.join(","),
            ...data.map(row => [
                row.rollNumber,
                `"${row.name}"`, // Quote name to handle commas
                row.batch,
                row.attendance,
                row.attendance < 75 ? "Defaulter" : "Safe"
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadComplete = () => {
        downloadCSV("Complete_Class_Attendance", enrichedStudents);
    };

    const handleDownloadBatch = (batch: string) => {
        const batchData = enrichedStudents.filter(s => s.batch === batch);
        downloadCSV(`Batch_${batch}_Attendance`, batchData);
    };

    const handleDownloadDefaulters = () => {
        const defaulters = enrichedStudents.filter(s => s.attendance < 75);
        downloadCSV("Defaulter_List", defaulters);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Reports & Downloads</h1>
                <p className="text-neutral-500">Export attendance data and reports</p>
            </div>

            <div className="grid gap-6">
                {/* 1. Complete Class Report */}
                <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">Complete Class Report</h3>
                            <p className="text-sm text-neutral-500">Full attendance sheet for all students (Roll 201-260)</p>
                        </div>
                    </div>
                    <Button onClick={handleDownloadComplete} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                    </Button>
                </Card>

                {/* 2. Batch-wise Reports */}
                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">Batch-wise Reports</h3>
                            <p className="text-sm text-neutral-500">Download attendance for specific practical batches</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-0 sm:pl-16">
                        <Button variant="outline" onClick={() => handleDownloadBatch("B1")} className="justify-between group">
                            Batch B1 <span className="text-xs text-neutral-400 group-hover:text-neutral-600">201-220</span> <Download className="h-3 w-3 opacity-50" />
                        </Button>
                        <Button variant="outline" onClick={() => handleDownloadBatch("B2")} className="justify-between group">
                            Batch B2 <span className="text-xs text-neutral-400 group-hover:text-neutral-600">221-240</span> <Download className="h-3 w-3 opacity-50" />
                        </Button>
                        <Button variant="outline" onClick={() => handleDownloadBatch("B3")} className="justify-between group">
                            Batch B3 <span className="text-xs text-neutral-400 group-hover:text-neutral-600">241-260+</span> <Download className="h-3 w-3 opacity-50" />
                        </Button>
                    </div>
                </Card>

                {/* 3. Defaulter List */}
                <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">Defaulter List</h3>
                            <p className="text-sm text-neutral-500">Students with attendance below 75%</p>
                        </div>
                    </div>
                    <Button variant="destructive" onClick={handleDownloadDefaulters} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF/CSV
                    </Button>
                </Card>
            </div>
        </div>
    );
}

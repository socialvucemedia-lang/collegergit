"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, RefreshCw, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Department {
    id: string;
    name: string;
    code: string;
}

interface Subject {
    id: string;
    code: string;
    name: string;
}

interface StudentRow {
    student_id: string;
    roll_number: string;
    name: string;
    section: string | null;
    batch: string | null;
    subject_attendance: Record<string, { total: number; present: number; percentage: number | null }>;
    overall: { total: number; present: number; percentage: number | null };
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SECTIONS = ["A", "B", "C", "D"];

export default function CompiledAttendancePage() {
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [selectedSemester, setSelectedSemester] = useState<string>("1");
    const [selectedSection, setSelectedSection] = useState<string>("all");
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [matrix, setMatrix] = useState<StudentRow[]>([]);

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (selectedSemester) {
            fetchCompiledData();
        }
    }, [selectedDepartment, selectedSemester, selectedSection]);

    const fetchDepartments = async () => {
        try {
            const response = await fetch("/api/departments");
            if (response.ok) {
                const result = await response.json();
                setDepartments(result.departments || []);
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    };

    const fetchCompiledData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append("semester", selectedSemester);
            if (selectedDepartment !== "all") params.append("department_id", selectedDepartment);
            if (selectedSection !== "all") params.append("section", selectedSection);

            const response = await fetch(`/api/reports/compiled?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                setSubjects(result.subjects || []);
                setMatrix(result.matrix || []);
            } else {
                setSubjects([]);
                setMatrix([]);
            }
        } catch (error) {
            console.error("Error fetching compiled data:", error);
            toast.error("Failed to load compiled attendance");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const params = new URLSearchParams();
            params.append("semester", selectedSemester);
            if (selectedDepartment !== "all") params.append("department_id", selectedDepartment);
            if (selectedSection !== "all") params.append("section", selectedSection);

            const response = await fetch(`/api/reports/compiled/export?${params.toString()}`);
            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `compiled_attendance_sem${selectedSemester}_${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("CSV downloaded successfully");
        } catch (error) {
            toast.error("Failed to export CSV");
        } finally {
            setExporting(false);
        }
    };

    const getPercentageColor = (percentage: number | null) => {
        if (percentage === null) return "text-neutral-400";
        if (percentage >= 85) return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
        if (percentage >= 75) return "text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Compiled Attendance</h1>
                    <p className="text-neutral-500 mt-1">Division-wise student attendance matrix</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchCompiledData} variant="outline" className="gap-2">
                        <RefreshCw size={16} />
                        Refresh
                    </Button>
                    <Button onClick={handleExport} disabled={exporting || matrix.length === 0} className="gap-2">
                        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Semester</Label>
                        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Semester" />
                            </SelectTrigger>
                            <SelectContent>
                                {SEMESTERS.map(s => (
                                    <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Section</Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="All Sections" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {SECTIONS.map(s => (
                                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Matrix Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-neutral-400" size={32} />
                </div>
            ) : matrix.length === 0 ? (
                <Card className="p-12 text-center">
                    <Table2 className="mx-auto mb-4 text-neutral-400" size={48} />
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No Data Available</h3>
                    <p className="text-neutral-500 mt-2">
                        Select a semester with students and subjects to view the attendance matrix.
                    </p>
                </Card>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-neutral-100 dark:bg-neutral-800">
                                <th className="p-3 text-left font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 sticky left-0 bg-neutral-100 dark:bg-neutral-800 z-10">Roll</th>
                                <th className="p-3 text-left font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 sticky left-16 bg-neutral-100 dark:bg-neutral-800 z-10">Name</th>
                                {subjects.map(sub => (
                                    <th key={sub.id} className="p-3 text-center font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 min-w-[80px]" title={sub.name}>
                                        {sub.code}
                                    </th>
                                ))}
                                <th className="p-3 text-center font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-700">Overall</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map((row, idx) => (
                                <tr key={row.student_id} className={idx % 2 === 0 ? "bg-white dark:bg-neutral-900" : "bg-neutral-50 dark:bg-neutral-800/50"}>
                                    <td className="p-3 font-mono text-xs border-b border-neutral-100 dark:border-neutral-800 sticky left-0 bg-inherit z-10">{row.roll_number}</td>
                                    <td className="p-3 font-medium border-b border-neutral-100 dark:border-neutral-800 sticky left-16 bg-inherit z-10 max-w-[150px] truncate" title={row.name}>{row.name}</td>
                                    {subjects.map(sub => {
                                        const att = row.subject_attendance[sub.id];
                                        return (
                                            <td key={sub.id} className={cn("p-3 text-center border-b border-neutral-100 dark:border-neutral-800", getPercentageColor(att?.percentage ?? null))}>
                                                {att?.percentage !== null && att?.percentage !== undefined ? `${att.percentage}%` : '-'}
                                            </td>
                                        );
                                    })}
                                    <td className={cn("p-3 text-center font-bold border-b border-neutral-100 dark:border-neutral-800", getPercentageColor(row.overall.percentage))}>
                                        {row.overall.percentage !== null ? `${row.overall.percentage}%` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

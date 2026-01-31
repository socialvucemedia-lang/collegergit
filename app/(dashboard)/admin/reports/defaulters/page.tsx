"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Download, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Department {
    id: string;
    name: string;
    code: string;
}

interface Defaulter {
    id: string;
    roll_number: string;
    name: string;
    email: string;
    semester: number | null;
    section: string | null;
    batch: string | null;
    department: string | null;
    total_classes: number;
    attended: number;
    percentage: number;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SECTIONS = ["A", "B", "C", "D"];

export default function DefaultersPage() {
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [selectedSemester, setSelectedSemester] = useState<string>("all");
    const [selectedSection, setSelectedSection] = useState<string>("all");
    const [threshold, setThreshold] = useState(75);
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState<{
        total_students: number;
        defaulters_count: number;
        threshold: number;
        defaulters: Defaulter[];
    } | null>(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchDefaulters();
    }, [selectedDepartment, selectedSemester, selectedSection, threshold]);

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

    const fetchDefaulters = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append("threshold", threshold.toString());
            if (selectedDepartment !== "all") params.append("department_id", selectedDepartment);
            if (selectedSemester !== "all") params.append("semester", selectedSemester);
            if (selectedSection !== "all") params.append("section", selectedSection);

            const response = await fetch(`/api/reports/defaulters?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error("Error fetching defaulters:", error);
            toast.error("Failed to load defaulters");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const params = new URLSearchParams();
            params.append("threshold", threshold.toString());
            if (selectedDepartment !== "all") params.append("department_id", selectedDepartment);
            if (selectedSemester !== "all") params.append("semester", selectedSemester);
            if (selectedSection !== "all") params.append("section", selectedSection);

            const response = await fetch(`/api/reports/defaulters/export?${params.toString()}`);
            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `defaulters_list_${new Date().toISOString().split("T")[0]}.csv`;
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

    const filteredDefaulters = data?.defaulters.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getAttendanceColor = (percentage: number) => {
        if (percentage < 50) return "text-red-600 dark:text-red-400";
        if (percentage < 75) return "text-orange-600 dark:text-orange-400";
        return "text-yellow-600 dark:text-yellow-400";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Global Defaulter's List</h1>
                    <p className="text-neutral-500 mt-1">Students below the attendance threshold</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchDefaulters} variant="outline" className="gap-2">
                        <RefreshCw size={16} />
                        Refresh
                    </Button>
                    <Button onClick={handleExport} disabled={exporting || !data?.defaulters.length} className="gap-2">
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
                                <SelectValue placeholder="All Semesters" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
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
                    <div className="space-y-2">
                        <Label>Threshold</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={threshold}
                                onChange={(e) => setThreshold(parseInt(e.target.value) || 75)}
                                className="w-20"
                                min={50}
                                max={100}
                            />
                            <span className="text-neutral-500">%</span>
                        </div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search by name or roll..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stats */}
            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">Defaulters</p>
                        <p className="text-3xl font-bold text-red-700 dark:text-red-300">{data.defaulters_count}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-neutral-500">Total Students</p>
                        <p className="text-3xl font-bold">{data.total_students}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-neutral-500">Defaulter Rate</p>
                        <p className="text-3xl font-bold">
                            {data.total_students > 0 ? Math.round((data.defaulters_count / data.total_students) * 100) : 0}%
                        </p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-neutral-500">Threshold</p>
                        <p className="text-3xl font-bold">&lt; {threshold}%</p>
                    </Card>
                </div>
            )}

            {/* Defaulters List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-neutral-400" size={32} />
                </div>
            ) : filteredDefaulters.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <AlertTriangle className="text-green-600 dark:text-green-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No Defaulters Found</h3>
                    <p className="text-neutral-500 mt-2">
                        All students are currently above the {threshold}% attendance threshold.
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredDefaulters.map((student) => (
                        <Card key={student.id} className="p-4 flex items-center justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                                    <AlertTriangle className="text-red-500" size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{student.name}</h3>
                                        <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                            {student.roll_number}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                                        {student.department && <span>{student.department}</span>}
                                        {student.semester && <span>Sem {student.semester}</span>}
                                        {student.section && <span>Sec {student.section}</span>}
                                        {student.batch && <span>Batch {student.batch}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-2xl font-bold ${getAttendanceColor(student.percentage)}`}>
                                    {student.percentage}%
                                </p>
                                <p className="text-xs text-neutral-400">
                                    {student.attended} / {student.total_classes} classes
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

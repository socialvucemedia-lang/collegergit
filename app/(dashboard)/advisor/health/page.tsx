"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Users } from "lucide-react";

interface SemesterStats {
    semester: number;
    total_records: number;
    present: number;
    percentage: number;
}

interface Department {
    id: string;
    code: string;
    name: string;
}

export default function ClassHealthPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        total_students: number;
        overall_percentage: number;
        by_semester: SemesterStats[];
    } | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDept, setSelectedDept] = useState<string>("all");

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchHealthData();
    }, [selectedDept]);

    const fetchDepartments = async () => {
        try {
            const response = await fetch("/api/departments");
            if (response.ok) {
                const data = await response.json();
                setDepartments(data.departments || []);
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    };

    const fetchHealthData = async () => {
        try {
            setLoading(true);
            const url = selectedDept !== "all"
                ? `/api/advisor/health?department_id=${selectedDept}`
                : "/api/advisor/health";

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching health data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Class Health Overview</h1>
                    <p className="text-neutral-500 mt-1">Aggregate attendance performance by semester and department.</p>
                </div>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.code} - {dept.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-neutral-400" size={32} />
                </div>
            ) : stats ? (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                                <TrendingUp size={16} className="text-neutral-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.overall_percentage}%</div>
                                <p className="text-xs text-neutral-500 mt-1">Across all selected classes</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                                <Users size={16} className="text-neutral-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_students}</div>
                                <p className="text-xs text-neutral-500 mt-1">Active enrollments</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card className="p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold">Performance by Semester</h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.by_semester}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="semester"
                                        tickFormatter={(value: number) => `Sem ${value}`}
                                    />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip
                                        formatter={(value: any) => [`${value}%`, 'Attendance']}
                                        labelFormatter={(label: any) => `Semester ${label}`}
                                    />
                                    <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Attendance %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="text-center py-12 text-neutral-500">
                    Failed to load data.
                </div>
            )}
        </div>
    );
}

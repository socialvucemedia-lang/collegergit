"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, TrendingUp, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HealthData {
    total_students: number;
    avg_attendance: number | null;
    below_threshold: number;
    present_today: number;
}

export default function AdvisorDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<HealthData | null>(null);

    useEffect(() => {
        fetchHealth();
    }, []);

    const fetchHealth = async () => {
        try {
            const response = await fetch('/api/advisor/health');
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error("Error fetching health:", error);
        } finally {
            setLoading(false);
        }
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
            <div className="text-center py-20 text-neutral-500">
                <Users className="mx-auto mb-4" size={48} />
                <p>No class data available</p>
            </div>
        );
    }

    const avgAttendance = data.avg_attendance ?? 0;

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Class Health</h1>
                <p className="text-neutral-500">{data.total_students} students enrolled</p>
            </div>

            {/* Overall Attendance - Hero Card */}
            <Card className={cn(
                "p-6 border-2",
                avgAttendance >= 75 ? "border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800" :
                    avgAttendance >= 65 ? "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-800" :
                        "border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800"
            )}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-neutral-500 mb-1">Average Attendance</p>
                        <h2 className={cn(
                            "text-4xl font-bold",
                            avgAttendance >= 75 ? "text-green-600" :
                                avgAttendance >= 65 ? "text-yellow-600" : "text-red-600"
                        )}>
                            {data.avg_attendance !== null ? `${avgAttendance}%` : 'N/A'}
                        </h2>
                    </div>
                    <div className="text-right">
                        <Badge variant={avgAttendance >= 75 ? "default" : "destructive"}>
                            {avgAttendance >= 75 ? "Healthy" : "Needs Attention"}
                        </Badge>
                        <p className="text-xs text-neutral-400 mt-2">{data.total_students} students</p>
                    </div>
                </div>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/advisor/risks">
                    <Card className="p-4 border-l-4 border-l-red-500 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-600">{data.below_threshold}</p>
                                <p className="text-xs text-neutral-500">Below 75%</p>
                            </div>
                        </div>
                        <div className="flex items-center text-xs text-neutral-400 mt-3">
                            View List <ChevronRight size={12} className="ml-1" />
                        </div>
                    </Card>
                </Link>

                <Card className="p-4 border-l-4 border-l-green-500">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <TrendingUp size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{data.present_today}</p>
                            <p className="text-xs text-neutral-500">Present Today</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Quick Actions</h3>

                <Link href="/advisor/students">
                    <Card className="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <Users size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-neutral-900 dark:text-neutral-100">View All Students</p>
                                <p className="text-xs text-neutral-500">{data.total_students} enrolled</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-neutral-400" />
                    </Card>
                </Link>
            </div>
        </div>
    );
}

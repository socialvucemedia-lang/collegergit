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
                "p-8 border shadow-sm transition-all duration-200 hover:shadow-md",
                avgAttendance >= 75 ? "bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-neutral-900 border-green-100 dark:border-green-900" :
                    avgAttendance >= 65 ? "bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-neutral-900 border-yellow-100 dark:border-yellow-900" :
                        "bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-neutral-900 border-red-100 dark:border-red-900"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/advisor/risks" className="block">
                    <Card className="h-full p-6 border shadow-sm hover:shadow-md hover:border-red-200 dark:hover:border-red-900 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 group-hover:scale-110 transition-transform">
                                <AlertTriangle size={24} />
                            </div>
                            <Badge variant="outline" className="border-red-100 text-red-600 bg-red-50 dark:border-red-900/50">
                                Action Needed
                            </Badge>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">{data.below_threshold}</p>
                            <p className="text-sm text-neutral-500 font-medium">Students Below 75%</p>
                        </div>
                        <div className="flex items-center text-xs font-medium text-red-600 mt-4 group-hover:translate-x-1 transition-transform">
                            View Risk List <ChevronRight size={14} className="ml-1" />
                        </div>
                    </Card>
                </Link>

                <Card className="p-6 border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600">
                            <TrendingUp size={24} />
                        </div>
                        <Badge variant="outline" className="border-green-100 text-green-600 bg-green-50 dark:border-green-900/50">
                            Today's Activity
                        </Badge>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">{data.present_today}</p>
                        <p className="text-sm text-neutral-500 font-medium">Students Present Today</p>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Quick Actions</h3>

                <Link href="/advisor/students">
                    <Card className="p-5 flex items-center justify-between hover:shadow-md transition-all border group cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 group-hover:scale-110 transition-transform">
                                <Users size={22} />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg">Student Directory</p>
                                <p className="text-sm text-neutral-500">Manage profiles for {data.total_students} students</p>
                            </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ChevronRight size={16} />
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    );
}

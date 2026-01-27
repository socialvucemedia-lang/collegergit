"use client";

import { useState, useEffect } from "react";
import { Users, GraduationCap, TrendingUp, Calendar, ArrowRightLeft, Book, Building2, Loader2 } from "lucide-react";
import AdminStatCard from "@/components/admin/AdminStatCard";
import QuickActionCard from "@/components/admin/QuickActionCard";
import DownloadWidget from "@/components/admin/DownloadWidget";
import NoticeBoardWidget from "@/components/admin/NoticeBoardWidget";
import { Card } from "@/components/ui/card";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        departments: 0,
        subjects: 0,
        allocations: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/stats");
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Stats fetch error:", error);
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

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">Admin Overview</h1>
                <p className="text-neutral-500 mt-1">Manage institutional operations and performance.</p>
            </div>

            {/* Top Row: Important Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard
                    title="Total Users"
                    value={stats.users.toString()}
                    description="Students, Teachers, Admins"
                    icon={Users}
                />
                <AdminStatCard
                    title="Departments"
                    value={stats.departments.toString()}
                    description="Academic Wings"
                    icon={Building2}
                />
                <AdminStatCard
                    title="Subjects"
                    value={stats.subjects.toString()}
                    description="Total Core/Electives"
                    icon={Book}
                />
                <AdminStatCard
                    title="Allocations"
                    value={stats.allocations.toString()}
                    description="Active Faculty Assignments"
                    icon={ArrowRightLeft}
                    trend={stats.allocations > 0 ? "Active" : "None"}
                    trendUp={stats.allocations > 0}
                />
            </div>

            {/* Middle Row: Management & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions Column */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <QuickActionCard
                        title="Timetable Management"
                        description="Update lecture slots, assign rooms, and resolve clashes."
                        icon={Calendar}
                        actionLabel="Manage Schedules"
                        href="/admin/timetable"
                        gradient="bg-gradient-to-br from-violet-600 to-indigo-600"
                    />
                    <QuickActionCard
                        title="Faculty Allocation"
                        description="Reassign subjects and manage temporary substitutions."
                        icon={GraduationCap}
                        actionLabel="Assign Faculty"
                        href="/admin/allocation"
                        gradient="bg-gradient-to-br from-pink-500 to-rose-500"
                    />
                    <div className="md:col-span-2">
                        <DownloadWidget />
                    </div>
                </div>

                {/* Right Column: Notices */}
                <div className="lg:col-span-1">
                    <NoticeBoardWidget />
                </div>
            </div>
        </div>
    )
}

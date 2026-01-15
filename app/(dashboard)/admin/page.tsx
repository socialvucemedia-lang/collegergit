"use client";

import { Users, GraduationCap, TrendingUp, Calendar, ArrowRightLeft } from "lucide-react";
import AdminStatCard from "@/components/admin/AdminStatCard";
import QuickActionCard from "@/components/admin/QuickActionCard";
import DownloadWidget from "@/components/admin/DownloadWidget";
import NoticeBoardWidget from "@/components/admin/NoticeBoardWidget";

export default function AdminDashboard() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">Admin Overview</h1>
                <p className="text-neutral-500 mt-1">Manage institutional operations and performance.</p>
            </div>

            {/* Top Row: Important Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AdminStatCard
                    title="Total Students"
                    value="2,405"
                    description="vs 2,350 last semester"
                    icon={Users}
                    trend="+2.3%"
                    trendUp={true}
                />
                <AdminStatCard
                    title="Avg. Attendance"
                    value="84%"
                    description="Weekly average"
                    icon={TrendingUp}
                    trend="-1.2%"
                    trendUp={false}
                />
                <AdminStatCard
                    title="Active Faculty"
                    value="142"
                    description="Currently on campus"
                    icon={GraduationCap}
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
                        href="/admin/timetable" // Placeholder route
                        gradient="bg-gradient-to-br from-violet-600 to-indigo-600"
                    />
                    <QuickActionCard
                        title="Faculty Allocation"
                        description="Reassign subjects and manage temporary substitutions."
                        icon={ArrowRightLeft}
                        actionLabel="Assign Faculty"
                        href="/admin/allocation" // Placeholder route
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

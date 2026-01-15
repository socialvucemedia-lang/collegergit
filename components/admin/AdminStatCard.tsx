"use client";

import { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}

export default function AdminStatCard({ title, value, description, icon: Icon, trend, trendUp }: AdminStatCardProps) {
    return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon size={64} />
            </div>
            <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3 text-neutral-500">
                    <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                        <Icon size={20} className="text-neutral-900 dark:text-neutral-100" />
                    </div>
                    <span className="text-sm font-medium">{title}</span>
                </div>
                <div>
                    <h3 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                        {value}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        {trend && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${trendUp ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {trend}
                            </span>
                        )}
                        <span className="text-xs text-neutral-400">{description}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

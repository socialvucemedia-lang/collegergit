"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
    const subjects = [
        { id: 'eg', name: "Engineering Graphics (EG)", total: 42, attended: 38, percent: 90, status: 'good' },
        { id: 'am2', name: "AM-II", total: 40, attended: 30, percent: 75, status: 'warning' },
        { id: 'ds', name: "Data Structures (DS)", total: 38, attended: 32, percent: 84, status: 'good' },
        { id: 'ep', name: "Engineering Physics (EP)", total: 36, attended: 21, percent: 58, status: 'critical' },
        { id: 'iks', name: "IKS", total: 45, attended: 40, percent: 88, status: 'good' },
    ];

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Attendance History</h1>
                <p className="text-neutral-500">Detailed breakdown by subject</p>
            </div>

            <div className="grid gap-4">
                {subjects.map((sub) => (
                    <Link href={`#`} key={sub.id}>
                        <Card className="p-4 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{sub.name}</h3>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        {sub.attended} / {sub.total} Sessions
                                    </p>
                                </div>
                                <div className={`text-xl font-bold ${sub.status === 'critical' ? 'text-red-500' :
                                    sub.status === 'warning' ? 'text-yellow-500' : 'text-green-600'
                                    }`}>
                                    {sub.percent}%
                                </div>
                            </div>
                            <Progress value={sub.percent} className={`h-2 ${sub.status === 'critical' ? '[&>div]:bg-red-500' :
                                sub.status === 'warning' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'
                                }`} />
                            <div className="flex justify-end mt-3 items-center text-xs text-neutral-400">
                                View Details <ChevronRight size={12} className="ml-1" />
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}

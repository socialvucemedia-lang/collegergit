"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronRight, Users, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function TeacherDashboard() {
    const sessions = [
        { id: 101, subject: "Engineering Graphics (EG)", time: "08:30 AM", room: "B-21", status: "Completed", count: 62 },
        { id: 102, subject: "AM-II", time: "09:30 AM", room: "B-21", status: "Completed", count: 60 },
        { id: 103, subject: "Data Structures (DS - B2)", time: "10:30 AM", room: "C-61", status: "Active", count: 28 },
    ];

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Today&apos;s Classes</h1>
                <p className="text-sm text-neutral-500">Wednesday, 24 Oct</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                    <Link href={session.status !== 'Upcoming' ? `/teacher/attendance/${session.id}` : '#'} key={session.id}>
                        <Card className={`p-4 transition-all active:scale-[0.99] border-l-4 ${session.status === 'Active' ? 'border-l-neutral-900 dark:border-l-neutral-100 shadow-md' :
                            session.status === 'Completed' ? 'border-l-green-500 opacity-80' :
                                'border-l-neutral-200 dark:border-l-neutral-800'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{session.subject}</span>
                                        {session.status === 'Active' && (
                                            <Badge variant="outline" className="text-[10px] h-5 bg-neutral-900 text-white dark:bg-white dark:text-black border-none animate-pulse">Now</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-neutral-500 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} />
                                            {session.time}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users size={14} />
                                            {session.count} Students
                                        </div>
                                    </div>
                                </div>

                                {session.status === 'Completed' ? (
                                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                                        <CheckCircle2 size={20} />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 flex items-center justify-center text-neutral-400">
                                        <ChevronRight size={20} />
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

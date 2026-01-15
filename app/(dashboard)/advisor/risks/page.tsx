"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { Mail, Phone, ChevronRight } from "lucide-react";
import Link from "next/link";

import studentData from "@/data/students.json";
import { Student } from "@/types/student";

export default function RiskListPage() {
    const [filter, setFilter] = useState<'critical' | 'warning'>('critical');

    const students = useMemo(() => (studentData as Student[]).map(s => {
        const attendance = s.attendanceRate || (Math.floor(Math.sin(Number(s.rollNumber)) * 20) + 70); // Semi-deterministic mock
        return {
            ...s,
            riskLevel: attendance < 65 ? 'critical' : 'warning',
            roll: s.rollNumber.toString(),
            attendance: attendance,
            contact: attendance < 65 ? "Parents notified" : "Warning pending"
        };
    }), []);

    const filteredStudents = students.filter(s => s.riskLevel === filter);

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">At-Risk Students</h1>
                <p className="text-neutral-500">Students requiring intervention</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg w-fit">
                <button
                    onClick={() => setFilter('critical')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'critical'
                        ? 'bg-white dark:bg-neutral-800 text-red-600 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                        }`}
                >
                    Critical (&lt;65%)
                </button>
                <button
                    onClick={() => setFilter('warning')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'warning'
                        ? 'bg-white dark:bg-neutral-800 text-yellow-600 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                        }`}
                >
                    Warning (&lt;75%)
                </button>
            </div>

            <div className="space-y-4">
                {filteredStudents.map((student) => (
                    <Card key={student.id} className="p-4 flex flex-col gap-4">
                        <Link href={`/advisor/student/${student.id}`} className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} />
                                    <AvatarFallback>{student.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{student.name}</h3>
                                    <p className="text-sm text-neutral-500 font-mono">{student.roll}</p>
                                </div>
                            </div>
                            <div className={`flex flex-col items-end`}>
                                <span className={`text-2xl font-bold ${student.riskLevel === 'critical' ? 'text-red-600' : 'text-yellow-600'
                                    }`}>
                                    {student.attendance}%
                                </span>
                                <span className="text-[10px] text-neutral-400 font-medium uppercase">Attendance</span>
                            </div>
                        </Link>

                        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                            <span className="text-xs text-neutral-400 italic">{student.contact}</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full">
                                    <Phone size={14} />
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full">
                                    <Mail size={14} />
                                </Button>
                                <Link href={`/advisor/student/${student.id}`}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                        <ChevronRight size={16} />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Users, ChevronRight, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

interface Student {
    id: string;
    rollNumber: string;
    name: string;
    email: string;
    section: string | null;
    batch: string | null;
    semester: number | null;
    department: string | null;
    attendance_percentage: number;
    total_classes: number;
    attended_classes: number;
}

export default function StudentListPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/advisor/students", {
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setStudents(data.students || []);
            }
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber.toString().includes(searchTerm)
    );

    const getAttendanceColor = (percentage: number) => {
        if (percentage >= 75) return "text-green-600 dark:text-green-400";
        if (percentage >= 65) return "text-yellow-600 dark:text-yellow-400";
        return "text-red-600 dark:text-red-400";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-neutral-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Student Directory</h1>
                <p className="text-neutral-500">Manage and view details for all students</p>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                    placeholder="Search by name or roll number..."
                    className="pl-10 h-12 text-base bg-white dark:bg-neutral-900 transition-all focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Student List */}
            <div className="grid gap-3">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                        <Link href={`/advisor/student/${student.id}`} key={student.id}>
                            <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all group">
                                <div className="flex items-center gap-5">
                                    <Avatar className="h-14 w-14 border-2 border-white dark:border-neutral-900 shadow-sm">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} />
                                        <AvatarFallback className="bg-neutral-100 text-neutral-600 font-medium text-lg">
                                            {student.name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg group-hover:text-blue-600 transition-colors">
                                            {student.name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500 mt-1">
                                            <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-xs font-medium">
                                                {student.rollNumber}
                                            </span>
                                            {(student.section || student.batch) && (
                                                <span className="flex items-center gap-1.5 border-l pl-3 border-neutral-200 dark:border-neutral-800">
                                                    {student.section && `Sec ${student.section}`}
                                                    {student.section && student.batch && " • "}
                                                    {student.batch}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-8 pl-20 sm:pl-0 w-full sm:w-auto">
                                    <div className="text-right">
                                        <p className={`text-3xl font-bold ${getAttendanceColor(student.attendance_percentage)}`}>
                                            {student.attendance_percentage}%
                                        </p>
                                        <p className="text-xs text-neutral-400 font-medium mt-0.5">
                                            {student.attended_classes}/{student.total_classes} classes
                                        </p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-blue-600" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-16 text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/10 rounded-xl border border-dashed">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No students found {searchTerm && `matching "${searchTerm}"`}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

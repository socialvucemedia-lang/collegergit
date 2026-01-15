"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Users, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import studentData from "@/data/students.json";

export default function StudentListPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredStudents = studentData.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber.toString().includes(searchTerm)
    );

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
                    className="pl-10 h-12 text-base bg-white dark:bg-neutral-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Student List */}
            <div className="grid gap-3">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                        <Link href={`/advisor/student/${student.id}`} key={student.id}>
                            <Card className="p-4 flex items-center justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 border border-neutral-200 dark:border-neutral-800">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} />
                                        <AvatarFallback>{student.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{student.name}</h3>
                                        <p className="text-xs text-neutral-500 font-mono">Roll: {student.rollNumber}</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-neutral-400" />
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-12 text-neutral-500">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No students found matching "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}

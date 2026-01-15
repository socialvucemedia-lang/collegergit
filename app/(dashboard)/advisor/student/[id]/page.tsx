"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, FileWarning, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";

import studentData from "@/data/students.json";
import { Student } from "@/types/student";

export default function StudentDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();

    const targetId = params.id;
    const studentInfo = studentData.find(s => s.id === targetId || s.id === `s${targetId}`);

    if (!studentInfo) {
        return (
            <div className="p-8 text-center">
                <p className="text-neutral-500 mb-4">Student not found</p>
                <Button onClick={() => router.back()}>Back</Button>
            </div>
        );
    }

    // Mock additional details
    const student = {
        name: studentInfo.name,
        roll: studentInfo.rollNumber.toString(),
        overall: (studentInfo as Student).attendanceRate || (Math.floor(Math.sin(Number(studentInfo.rollNumber)) * 20) + 75),
        email: `${studentInfo.name.toLowerCase().replace(/\s+/g, '.')}@institute.edu`,
        parent: "Guardian Name",
        parentPhone: "+91 xxxxx xxxxx",
        recentAbsences: [
            { date: "24 Oct", subject: "Engineering Graphics (EG)" },
            { date: "23 Oct", subject: "AM-II" },
            { date: "23 Oct", subject: "Data Structures (DS)" },
        ]
    };

    return (
        <div className="space-y-6 pb-20">
            <Button variant="ghost" size="sm" className="pl-0 text-neutral-500 hover:text-neutral-900" onClick={() => router.back()}>
                <ArrowLeft size={16} className="mr-2" /> Back to List
            </Button>

            <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-neutral-900 shadow-lg">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} />
                    <AvatarFallback>{student.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{student.name}</h1>
                    <p className="text-neutral-500 font-mono">{student.roll}</p>
                </div>
                <Badge variant="destructive" className="px-3 py-1 text-sm">Critical Risk: {student.overall}%</Badge>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full">
                    Contact Student
                </Button>
                <Button className="w-full bg-neutral-900 text-white dark:bg-white dark:text-black">
                    Call Parent
                </Button>
            </div>

            {/* Analysis Blocks */}
            <div className="grid gap-4">
                <Card className="p-5">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingDown size={18} className="text-red-500" />
                        Recent Absences
                    </h3>
                    <div className="space-y-3">
                        {student.recentAbsences.map((abs, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm border-b border-neutral-100 last:border-0 pb-2 last:pb-0 dark:border-neutral-800">
                                <span className="font-medium text-neutral-700 dark:text-neutral-300">{abs.subject}</span>
                                <span className="text-neutral-500 flex items-center gap-1">
                                    <Calendar size={12} /> {abs.date}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-5">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FileWarning size={18} className="text-yellow-600" />
                        Guardian Info
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Guardian</span>
                            <span className="font-medium">{student.parent}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Contact</span>
                            <span className="font-medium">{student.parentPhone}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

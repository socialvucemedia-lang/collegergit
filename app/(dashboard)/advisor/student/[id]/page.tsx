"use client";

// Advisor Student Detail Page
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, FileWarning, TrendingDown, BookOpen, FileText, ClipboardList, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import studentData from "@/data/students.json";
import { Student } from "@/types/student";

export default function StudentDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const [note, setNote] = useState("");
    const [medicalNote, setMedicalNote] = useState("");

    const handleSaveNote = (type: 'general' | 'medical') => {
        toast.success(`${type === 'medical' ? 'Medical leave' : 'General'} note saved`);
        if (type === 'general') setNote("");
        else setMedicalNote("");
    };

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
        cgpa: (7 + (Number(studentInfo.rollNumber) % 30) / 10).toFixed(2),
        iaMarks: {
            ia1: 12 + (Number(studentInfo.rollNumber) % 8),
            ia2: 14 + (Number(studentInfo.rollNumber) % 6)
        },
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

            {/* Academic Performance */}
            <Card className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-600" />
                    Academic Performance
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                        <p className="text-xs text-neutral-500 uppercase font-medium">CGPA</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{student.cgpa}</p>
                    </div>
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                        <p className="text-xs text-neutral-500 uppercase font-medium">IA 1</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{student.iaMarks.ia1}/20</p>
                    </div>
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                        <p className="text-xs text-neutral-500 uppercase font-medium">IA 2</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{student.iaMarks.ia2}/20</p>
                    </div>
                </div>
            </Card>

            {/* Notes Section */}
            <Card className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ClipboardList size={18} className="text-neutral-600" />
                    Advisor Notes
                </h3>
                <Tabs defaultValue="general">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="medical">Medical Leave</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general" className="space-y-3">
                        <Textarea
                            placeholder="Add a general note about student progress or behavior..."
                            className="resize-none"
                            value={note}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                        />
                        <Button size="sm" className="w-full" onClick={() => handleSaveNote('general')} disabled={!note.trim()}>
                            <Send size={14} className="mr-2" /> Save Note
                        </Button>
                    </TabsContent>
                    <TabsContent value="medical" className="space-y-3">
                        <Textarea
                            placeholder="Record medical leave details..."
                            className="resize-none border-red-200 focus:border-red-400 dark:border-red-900/50"
                            value={medicalNote}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMedicalNote(e.target.value)}
                        />
                        <Button size="sm" variant="destructive" className="w-full" onClick={() => handleSaveNote('medical')} disabled={!medicalNote.trim()}>
                            <FileText size={14} className="mr-2" /> Log Medical Leave
                        </Button>
                    </TabsContent>
                </Tabs>
            </Card>

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

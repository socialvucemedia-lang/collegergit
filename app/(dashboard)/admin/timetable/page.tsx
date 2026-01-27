"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, GripVertical, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Subject {
    id: string;
    code: string;
    name: string;
}

interface Teacher {
    id: string;
    employee_id: string;
    users: { full_name: string } | { full_name: string }[];
}

interface TimetableSlot {
    id: string;
    subject_id: string;
    teacher_id: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string | null;
    section: string | null;
    subjects: Subject;
    teachers: Teacher | null;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];
const SECTIONS = ["A", "B", "C", "D"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TimetablePage() {
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSection, setSelectedSection] = useState("A");
    const [selectedSemester, setSelectedSemester] = useState("1");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null);
    const [formData, setFormData] = useState({
        subject_id: "",
        teacher_id: "",
        room: "",
        end_time: "",
    });
    const [draggedSubject, setDraggedSubject] = useState<Subject | null>(null);

    useEffect(() => {
        fetchTimetable();
        fetchSubjects();
        fetchTeachers();
    }, [selectedSection, selectedSemester]);

    const fetchTimetable = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/timetable?section=${selectedSection}&semester=${selectedSemester}`);
            if (response.ok) {
                const data = await response.json();
                setSlots(data.slots || []);
            }
        } catch (error) {
            console.error("Error fetching timetable:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await fetch(`/api/subjects?semester=${selectedSemester}`);
            if (response.ok) {
                const data = await response.json();
                setSubjects(data.subjects || []);
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await fetch("/api/teachers");
            if (response.ok) {
                const data = await response.json();
                setTeachers(data.teachers || []);
            }
        } catch (error) {
            console.error("Error fetching teachers:", error);
        }
    };

    const handleCellClick = (day: number, time: string) => {
        setSelectedSlot({ day, time });
        const endHour = parseInt(time.split(":")[0]) + 1;
        setFormData({
            subject_id: "",
            teacher_id: "",
            room: "",
            end_time: `${endHour.toString().padStart(2, "0")}:00`,
        });
        setIsDialogOpen(true);
    };

    const handleDrop = async (day: number, time: string, subject: Subject) => {
        const endHour = parseInt(time.split(":")[0]) + 1;
        try {
            const response = await fetch("/api/timetable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject_id: subject.id,
                    day_of_week: day,
                    start_time: time,
                    end_time: `${endHour.toString().padStart(2, "0")}:00`,
                    section: selectedSection,
                    semester: parseInt(selectedSemester),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.conflicts && data.conflicts.length > 0) {
                    data.conflicts.forEach((c: string) => toast.error(c));
                } else {
                    throw new Error(data.error || "Failed to add slot");
                }
                return;
            }

            toast.success(`Added ${subject.code} to timetable`);
            fetchTimetable();
        } catch (error: any) {
            toast.error(error.message || "Failed to add slot");
        }
        setDraggedSubject(null);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot || !formData.subject_id) return;

        try {
            const response = await fetch("/api/timetable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject_id: formData.subject_id,
                    teacher_id: formData.teacher_id || null,
                    day_of_week: selectedSlot.day,
                    start_time: selectedSlot.time,
                    end_time: formData.end_time,
                    room: formData.room || null,
                    section: selectedSection,
                    semester: parseInt(selectedSemester),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.conflicts && data.conflicts.length > 0) {
                    data.conflicts.forEach((c: string) => toast.error(c));
                } else {
                    throw new Error(data.error || "Failed to add slot");
                }
                return;
            }

            toast.success("Lecture added to timetable!");
            setIsDialogOpen(false);
            fetchTimetable();
        } catch (error: any) {
            toast.error(error.message || "Failed to add slot");
        }
    };


    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/timetable/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete");
            toast.success("Lecture removed!");
            fetchTimetable();
        } catch (error) {
            toast.error("Failed to remove lecture");
        }
    };

    const getSlotForCell = (day: number, time: string) => {
        return slots.find((s) => s.day_of_week === day && s.start_time === time);
    };

    const getTeacherName = (teacher: Teacher | null) => {
        if (!teacher) return null;
        const users = teacher.users;
        if (Array.isArray(users)) {
            return users[0]?.full_name || null;
        }
        return users?.full_name || null;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Timetable Builder</h1>
                    <p className="text-neutral-500 mt-1">Drag subjects onto the grid or click a cell to add lectures.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Semester" />
                        </SelectTrigger>
                        <SelectContent>
                            {SEMESTERS.map((sem) => (
                                <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Section" />
                        </SelectTrigger>
                        <SelectContent>
                            {SECTIONS.map((sec) => (
                                <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Sidebar - Draggable Subjects */}
                <Card className="w-64 p-4 h-fit sticky top-4">
                    <h3 className="font-semibold mb-3 text-neutral-900 dark:text-neutral-100">Subjects</h3>
                    <p className="text-xs text-neutral-500 mb-3">Drag onto the grid</p>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {subjects.map((subject) => (
                            <div
                                key={subject.id}
                                draggable
                                onDragStart={() => setDraggedSubject(subject)}
                                onDragEnd={() => setDraggedSubject(null)}
                                className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg cursor-grab active:cursor-grabbing hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                                <GripVertical size={14} className="text-neutral-400" />
                                <div>
                                    <p className="font-medium text-sm">{subject.code}</p>
                                    <p className="text-xs text-neutral-500 truncate">{subject.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Timetable Grid */}
                <div className="flex-1 overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-neutral-400" size={32} />
                        </div>
                    ) : (
                        <div className="min-w-[800px]">
                            {/* Header Row */}
                            <div className="grid grid-cols-7 gap-1 mb-1">
                                <div className="p-2 text-center text-sm font-medium text-neutral-500">Time</div>
                                {DAYS.map((day) => (
                                    <div key={day} className="p-2 text-center text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Time Rows */}
                            {TIME_SLOTS.map((time) => (
                                <div key={time} className="grid grid-cols-7 gap-1 mb-1">
                                    <div className="p-2 text-center text-xs text-neutral-500 flex items-center justify-center">
                                        {time}
                                    </div>
                                    {DAYS.map((_, dayIndex) => {
                                        const slot = getSlotForCell(dayIndex, time);
                                        return (
                                            <div
                                                key={dayIndex}
                                                onClick={() => !slot && handleCellClick(dayIndex, time)}
                                                onDragOver={(e) => { e.preventDefault(); }}
                                                onDrop={() => draggedSubject && handleDrop(dayIndex, time, draggedSubject)}
                                                className={`min-h-[60px] rounded border-2 border-dashed transition-all ${slot
                                                    ? "border-transparent bg-blue-50 dark:bg-blue-900/30"
                                                    : draggedSubject
                                                        ? "border-blue-300 bg-blue-50/50 dark:bg-blue-900/20"
                                                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 cursor-pointer"
                                                    }`}
                                            >
                                                {slot && (
                                                    <div className="p-2 h-full flex flex-col justify-between group">
                                                        <div>
                                                            <p className="font-semibold text-sm text-blue-700 dark:text-blue-400">{slot.subjects?.code}</p>
                                                            <p className="text-xs text-neutral-500 truncate">{slot.subjects?.name}</p>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <div className="flex items-center gap-1 text-xs text-neutral-400">
                                                                {slot.room && (
                                                                    <>
                                                                        <MapPin size={10} />
                                                                        <span>{slot.room}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(slot.id); }}
                                                            >
                                                                <Trash2 size={12} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Slot Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Lecture</DialogTitle>
                        <DialogDescription>
                            {selectedSlot && `${DAYS[selectedSlot.day]} at ${selectedSlot.time}`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Subject *</Label>
                            <Select
                                value={formData.subject_id}
                                onValueChange={(val: string) => setFormData({ ...formData, subject_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id}>
                                            {subject.code} - {subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Teacher (Optional)</Label>
                            <Select
                                value={formData.teacher_id}
                                onValueChange={(val: string) => setFormData({ ...formData, teacher_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map((teacher) => (
                                        <SelectItem key={teacher.id} value={teacher.id}>
                                            {getTeacherName(teacher) || teacher.employee_id}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <Select
                                    value={formData.end_time}
                                    onValueChange={(val: string) => setFormData({ ...formData, end_time: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIME_SLOTS.filter((t) => selectedSlot && t > selectedSlot.time).map((time) => (
                                            <SelectItem key={time} value={time}>{time}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Room</Label>
                                <Input
                                    value={formData.room}
                                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                    placeholder="e.g., Lab 101"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Add Lecture</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

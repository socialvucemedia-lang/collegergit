"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, GripVertical, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SlotDetailsDialog } from "./SlotDetailsDialog";

// --- Types ---

interface Department {
    id: string;
    name: string;
    code: string;
}

interface Subject {
    id: string;
    code: string;
    name: string;
}

interface Slot {
    id: string;
    subject_id: string;
    teacher_id: string | null;
    day_of_week: number;
    start_time: string; // HH:MM:SS
    end_time: string;   // HH:MM:SS
    room: string | null;
    subjects?: { code: string; name: string };
    teachers?: { users: { full_name: string } };
}

// --- Constants ---

const DAYS = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
];

const START_HOUR = 8;
const END_HOUR = 18; // 6 PM
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

export default function TimetableBuilder() {
    const [loading, setLoading] = useState(false);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    // Filters
    const [selectedDepartment, setSelectedDepartment] = useState<string>("");
    const [selectedSemester, setSelectedSemester] = useState<string>("1");
    const [selectedSection, setSelectedSection] = useState<string>("A");
    const [selectedBatch, setSelectedBatch] = useState<string>("all");

    // Dragging State
    const [draggedSubject, setDraggedSubject] = useState<Subject | null>(null);

    // Editing State
    const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Auto-fill memory
    const [lastUsedRoom, setLastUsedRoom] = useState<string>("");

    // --- Data Fetching ---

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (selectedDepartment && selectedSemester) {
            fetchSubjects();
        }
    }, [selectedDepartment, selectedSemester]);

    useEffect(() => {
        if (selectedDepartment && selectedSemester && selectedSection) {
            fetchTimetable();
        }
    }, [selectedDepartment, selectedSemester, selectedSection, selectedBatch]);

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/departments");
            if (res.ok) {
                const data = await res.json();
                setDepartments(data.departments || []);
                if (data.departments?.[0]) {
                    setSelectedDepartment(data.departments[0].id);
                }
            }
        } catch (error) {
            console.error("Error fetching departments", error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const params = new URLSearchParams({
                semester: selectedSemester,
                department_id: selectedDepartment
            });
            const res = await fetch(`/api/subjects?${params}`);
            if (res.ok) {
                const data = await res.json();
                setSubjects(data.subjects || []);
            }
        } catch (error) {
            console.error("Error fetching subjects", error);
        }
    };

    const fetchTimetable = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                department_id: selectedDepartment,
                semester: selectedSemester,
                section: selectedSection
            });
            if (selectedBatch && selectedBatch !== "all") {
                params.append("batch", selectedBatch);
            }

            const res = await fetch(`/api/timetable?${params}`);
            if (res.ok) {
                const data = await res.json();
                setSlots(data.slots || []);
            }
        } catch (error) {
            console.error("Error fetching timetable", error);
            toast.error("Failed to fetch timetable");
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleSlotCreate = async (subject: Subject, day: number, hour: number) => {
        try {
            const start_time = `${hour.toString().padStart(2, '0')}:00:00`;
            const end_time = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

            const payload = {
                subject_id: subject.id,
                day_of_week: day,
                start_time,
                end_time,
                room: lastUsedRoom || "101", // Auto-fill
                section: selectedSection,
                semester: parseInt(selectedSemester),
                batch: selectedBatch !== "all" ? selectedBatch : null
            };

            const res = await fetch("/api/timetable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                toast.success("Class scheduled");
                setSlots(prev => [...prev, data.slot]);
                // Open dialog immediately for fine-tuning? Maybe optional.
                // For now, let's just add it.
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to schedule");
            }
        } catch (error) {
            toast.error("Error scheduling class");
        }
    };

    const handleSlotUpdate = async (slotId: string, updates: any) => {
        try {
            // Include days/times if not present? The updates object should have them.
            // But we actually only edit time and room in the dialog usually.
            // If day changes, that's a drag event (not implemented yet for update, only create).

            const res = await fetch(`/api/timetable/${slotId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                toast.success("Class updated");
                setSlots(prev => prev.map(s => s.id === slotId ? { ...s, ...updates } : s));
                // Update memory
                if (updates.room) setLastUsedRoom(updates.room);
            } else {
                toast.error("Failed to update class");
            }
        } catch (error) {
            toast.error("Error updating class");
        }
    };

    const handleSlotDelete = async (slotId: string) => {
        try {
            const res = await fetch(`/api/timetable/${slotId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Class removed");
                setSlots(prev => prev.filter(s => s.id !== slotId));
            } else {
                toast.error("Failed to delete class");
            }
        } catch (error) {
            toast.error("Error deleting class");
        }
    };


    // --- Drag Handlers ---

    const handleDrop = (e: React.DragEvent, day: number, hour: number) => {
        e.preventDefault();
        const subjectData = e.dataTransfer.getData("application/json");
        if (subjectData) {
            try {
                const subject = JSON.parse(subjectData);
                handleSlotCreate(subject, day, hour);
            } catch (err) {
                console.error("Failed to parse dropped data");
            }
        } else if (draggedSubject) {
            handleSlotCreate(draggedSubject, day, hour);
        }
        setDraggedSubject(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };


    // --- Grid Helpers ---

    // Get slots for a specific cell
    const getSlotsForCell = (day: number, hour: number) => {
        return slots.filter(slot => {
            const slotStartHour = parseInt(slot.start_time.split(':')[0]);
            return slot.day_of_week === day && slotStartHour === hour;
        });
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Timetable Builder</h1>
                    <p className="text-neutral-500">Drag subjects onto the weekly grid to schedule classes</p>
                </div>
                {loading && <Loader2 className="animate-spin text-neutral-400" />}
            </div>

            {/* Filters */}
            <Card className="p-4 shrink-0">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Semester</Label>
                        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Semester" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                    <SelectItem key={s} value={s.toString()}>Sem {s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Section</Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Section" />
                            </SelectTrigger>
                            <SelectContent>
                                {["A", "B", "C", "D"].map(s => (
                                    <SelectItem key={s} value={s}>Sec {s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Batch (Optional)</Label>
                        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="All Batches" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Batches</SelectItem>
                                {["A1", "A2", "A3", "B1", "B2", "B3"].map(b => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* Sidebar - Draggable Subjects */}
                <Card className="w-64 p-4 flex flex-col gap-3 shrink-0 overflow-y-auto">
                    <h3 className="font-semibold text-sm uppercase text-neutral-500 mb-2">Subjects</h3>
                    {subjects.length === 0 ? (
                        <p className="text-sm text-neutral-400 text-center italic">No subjects found for this semester.</p>
                    ) : (
                        subjects.map(sub => (
                            <div
                                key={sub.id}
                                draggable
                                onDragStart={(e) => {
                                    setDraggedSubject(sub);
                                    e.dataTransfer.setData("application/json", JSON.stringify(sub));
                                }}
                                className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-grab hover:shadow-md transition-all active:cursor-grabbing flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{sub.code}</p>
                                    <p className="text-xs text-neutral-500 truncate max-w-[150px]" title={sub.name}>{sub.name}</p>
                                </div>
                                <GripVertical size={16} className="text-neutral-400 group-hover:text-neutral-600" />
                            </div>
                        ))
                    )}

                    <div className="mt-auto p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-lg flex gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <p>Drag subjects to the grid. Click a slot to edit/delete.</p>
                    </div>
                </Card>

                {/* WEEKLY GRID */}
                <Card className="flex-1 bg-white dark:bg-neutral-900 overflow-auto relative">
                    <div className="min-w-[800px] h-full flex flex-col">

                        {/* Header Row */}
                        <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
                            <div className="p-3 text-xs font-semibold text-neutral-500 text-center border-r border-neutral-200 dark:border-neutral-800">Time</div>
                            {DAYS.map(day => (
                                <div key={day.value} className="p-3 text-sm font-bold text-neutral-900 dark:text-white text-center border-r border-neutral-200 dark:border-neutral-800 last:border-r-0">
                                    {day.label}
                                </div>
                            ))}
                        </div>

                        {/* Grid Body */}
                        <div className="flex-1 overflow-y-auto">
                            {HOURS.map(hour => (
                                <div key={hour} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-neutral-200 dark:border-neutral-800 min-h-[100px]">
                                    {/* Time Label */}
                                    <div className="p-2 text-xs text-neutral-500 text-center border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                                        {hour}:00
                                        <div className="text-[10px] text-neutral-400">{hour < 12 ? 'AM' : 'PM'}</div>
                                    </div>

                                    {/* Day Cells */}
                                    {DAYS.map(day => {
                                        const cellSlots = getSlotsForCell(day.value, hour);

                                        return (
                                            <div
                                                key={`${day.value}-${hour}`}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, day.value, hour)}
                                                className={cn(
                                                    "border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 p-1 relative transition-colors",
                                                    draggedSubject ? "hover:bg-blue-50 dark:hover:bg-blue-900/10" : ""
                                                )}
                                            >
                                                {/* Render Slots */}
                                                {cellSlots.map(slot => (
                                                    <div
                                                        key={slot.id}
                                                        onClick={() => {
                                                            setEditingSlot(slot);
                                                            setIsDialogOpen(true);
                                                        }}
                                                        className="mb-1 p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 cursor-pointer hover:brightness-95 transition-all shadow-sm"
                                                    >
                                                        <div className="font-bold text-xs text-blue-900 dark:text-blue-100 truncate">
                                                            {slot.subjects?.code}
                                                        </div>
                                                        <div className="text-[10px] text-blue-700 dark:text-blue-300 leading-tight">
                                                            Room: {slot.room || 'N/A'}
                                                        </div>
                                                        {/* Show exact range if it's different from standard hour? 
                                                            Actually, visually we just pile them in the hour for now.
                                                        */}
                                                        <div className="text-[10px] opacity-70">
                                                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Empty State / Add Button Hint (Optional) */}
                                                {cellSlots.length === 0 && (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none">
                                                        <Plus className="text-neutral-300" size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <SlotDetailsDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                slot={editingSlot}
                onUpdate={handleSlotUpdate}
                onDelete={handleSlotDelete}
            />
        </div>
    );
}

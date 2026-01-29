"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer, Views, DateLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, GripVertical, Trash2, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

// Setup localizer
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

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

interface Teacher {
    id: string;
    user: {
        full_name: string;
    };
}

interface Slot {
    id: string;
    subject_id: string;
    teacher_id: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string | null;
    subjects?: { code: string; name: string };
    teachers?: { users: { full_name: string } };
}

// Helper to convert API slot to Calendar Event
const slotToEvent = (slot: Slot, baseDate: Date) => {
    // Calculate the date for this slot based on the current week's Sunday
    const startOfWeek = moment(baseDate).startOf('week').toDate(); // Sunday
    const slotDate = moment(startOfWeek).add(slot.day_of_week, 'days').toDate();

    const [startHour, startMinute] = slot.start_time.split(':').map(Number);
    const [endHour, endMinute] = slot.end_time.split(':').map(Number);

    const start = new Date(slotDate);
    start.setHours(startHour, startMinute, 0);

    const end = new Date(slotDate);
    end.setHours(endHour, endMinute, 0);

    return {
        id: slot.id,
        title: `${slot.subjects?.code || 'Unknown'} (${slot.room || 'No Room'})`,
        start,
        end,
        resource: slot
    };
};

export default function TimetableBuilder() {
    const [loading, setLoading] = useState(false);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    // Filters
    const [selectedDepartment, setSelectedDepartment] = useState<string>("");
    const [selectedSemester, setSelectedSemester] = useState<string>("1");
    const [selectedSection, setSelectedSection] = useState<string>("A");
    const [selectedBatch, setSelectedBatch] = useState<string>("all");

    // Dragging State
    const [draggedSubject, setDraggedSubject] = useState<Subject | null>(null);

    // Initial Fetch
    useEffect(() => {
        fetchDepartments();
    }, []);

    // Fetch subjects when filters change
    useEffect(() => {
        if (selectedDepartment && selectedSemester) {
            fetchSubjects();
        }
    }, [selectedDepartment, selectedSemester]);

    // Fetch timetable when all filters are ready
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
                // Convert to events
                const evts = (data.slots || []).map((s: Slot) => slotToEvent(s, new Date()));
                setEvents(evts);
            }
        } catch (error) {
            console.error("Error fetching timetable", error);
            toast.error("Failed to fetch timetable");
        } finally {
            setLoading(false);
        }
    };

    const handleSlotCreate = async (subject: Subject, start: Date, end: Date) => {
        try {
            const day_of_week = moment(start).day();
            const start_time = moment(start).format("HH:mm:00");
            const end_time = moment(end).format("HH:mm:00");

            const payload = {
                subject_id: subject.id,
                day_of_week,
                start_time,
                end_time,
                room: "101", // Default room, editable later
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
                toast.success("Class scheduled");
                fetchTimetable();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to schedule");
            }
        } catch (error) {
            toast.error("Error scheduling class");
        }
    };

    const handleEventMove = async ({ event, start, end }: any) => {
        const slot = event.resource as Slot;
        const day_of_week = moment(start).day();
        const start_time = moment(start).format("HH:mm:00");
        const end_time = moment(end).format("HH:mm:00");

        try {
            const res = await fetch(`/api/timetable/${slot.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    day_of_week,
                    start_time,
                    end_time
                })
            });

            if (res.ok) {
                toast.success("Class rescheduled");
                fetchTimetable();
            } else {
                toast.error("Failed to reschedule class");
            }
        } catch (error) {
            toast.error("Error updating class");
        }
    };

    const handleSelectEvent = async (event: any) => {
        const slot = event.resource as Slot;
        if (confirm(`Delete ${event.title}?`)) {
            try {
                const res = await fetch(`/api/timetable/${slot.id}`, {
                    method: "DELETE"
                });
                if (res.ok) {
                    toast.success("Class removed");
                    setEvents(prev => prev.filter(e => e.id !== slot.id));
                } else {
                    toast.error("Failed to delete class");
                }
            } catch (error) {
                toast.error("Error deleting class");
            }
        }
    };

    const handleDropFromOutside = useCallback(
        ({ start, end }: { start: Date; end: Date }) => {
            if (draggedSubject) {
                handleSlotCreate(draggedSubject, start, end);
                setDraggedSubject(null);
            }
        },
        [draggedSubject, selectedSection, selectedSemester, selectedBatch]
    );

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Timetable Builder</h1>
                    <p className="text-neutral-500">Drag subjects onto the calendar to schedule classes</p>
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
                                onDragStart={() => setDraggedSubject(sub)}
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
                        <p>Drag subjects to the grid to schedule. Click an event to delete.</p>
                    </div>
                </Card>

                {/* Calendar Grid */}
                <Card className="flex-1 p-4 bg-white dark:bg-neutral-900 overflow-hidden">
                    <DnDCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor={(event: any) => new Date(event.start)}
                        endAccessor={(event: any) => new Date(event.end)}
                        defaultView={Views.WEEK}
                        views={[Views.WEEK, Views.DAY]}
                        step={60}
                        timeslots={1}
                        min={new Date(0, 0, 0, 8, 0, 0)} // Start at 8 AM
                        max={new Date(0, 0, 0, 18, 0, 0)} // End at 6 PM
                        selectable
                        resizable
                        onEventDrop={handleEventMove}
                        onEventResize={handleEventMove}
                        onSelectEvent={handleSelectEvent}
                        onDropFromOutside={({ start, end }: { start: string | Date; end: string | Date }) => {
                            handleDropFromOutside({ start: new Date(start), end: new Date(end) });
                        }}
                        dragFromOutsideItem={() => draggedSubject || {}}
                        draggableAccessor={() => true}
                        className="h-full font-sans text-sm"
                    />
                </Card>
            </div>
        </div>
    );
}

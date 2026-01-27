"use client";

import { useState, useEffect } from "react";
import { Plus, Search, ArrowRightLeft, Trash2, Loader2, GraduationCap, Book, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Teacher {
    id: string;
    employee_id: string;
    users: { full_name: string; email: string } | { full_name: string; email: string }[];
}

interface Subject {
    id: string;
    code: string;
    name: string;
    semester: number | null;
    departments: { code: string; name: string } | null;
}

interface Allocation {
    id: string;
    teacher_id: string;
    subject_id: string;
    section: string | null;
    batch: string | null;
    academic_year: string;
    teachers: Teacher;
    subjects: Subject;
}

const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = [
    `${CURRENT_YEAR - 1}-${CURRENT_YEAR}`,
    `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`,
    `${CURRENT_YEAR + 1}-${CURRENT_YEAR + 2}`,
];

const SECTIONS = ["A", "B", "C", "D", "E"];
const BATCHES = ["B1", "B2", "B3", "B4"];

export default function AllocationPage() {
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterYear, setFilterYear] = useState<string>(ACADEMIC_YEARS[1]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        teacher_id: "",
        subject_id: "",
        section: "",
        batch: "entire", // "entire" = Entire Section, else specific batch
        academic_year: ACADEMIC_YEARS[1],
    });

    useEffect(() => {
        fetchAllocations();
        fetchTeachers();
        fetchSubjects();
    }, [filterYear]);

    const fetchAllocations = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/allocations?academic_year=${filterYear}`);
            if (response.ok) {
                const data = await response.json();
                setAllocations(data.allocations || []);
            }
        } catch (error) {
            console.error("Error fetching allocations:", error);
            toast.error("Failed to load allocations");
        } finally {
            setLoading(false);
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

    const fetchSubjects = async () => {
        try {
            const response = await fetch("/api/subjects");
            if (response.ok) {
                const data = await response.json();
                setSubjects(data.subjects || []);
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.section) {
            toast.error("Section is required");
            return;
        }

        try {
            const response = await fetch("/api/allocations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacher_id: formData.teacher_id,
                    subject_id: formData.subject_id,
                    section: formData.section,
                    batch: formData.batch === "entire" ? null : formData.batch,
                    academic_year: formData.academic_year,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create allocation");
            }

            toast.success("Allocation created!");
            setIsDialogOpen(false);
            resetForm();
            fetchAllocations();
        } catch (error: any) {
            toast.error(error.message || "Failed to create allocation");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this allocation?")) return;
        try {
            const response = await fetch(`/api/allocations/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete");
            toast.success("Allocation removed!");
            fetchAllocations();
        } catch (error) {
            toast.error("Failed to remove allocation");
        }
    };

    const resetForm = () => {
        setFormData({
            teacher_id: "",
            subject_id: "",
            section: "",
            batch: "entire",
            academic_year: ACADEMIC_YEARS[1],
        });
    };

    const getTeacherName = (teacher: Teacher) => {
        const users = teacher.users;
        if (Array.isArray(users)) {
            return users[0]?.full_name || "Unknown";
        }
        return users?.full_name || "Unknown";
    };

    const filteredAllocations = allocations.filter((alloc) => {
        const teacherName = getTeacherName(alloc.teachers);
        const subjectName = alloc.subjects?.name || "";
        const subjectCode = alloc.subjects?.code || "";
        const query = searchQuery.toLowerCase();
        return (
            teacherName.toLowerCase().includes(query) ||
            subjectName.toLowerCase().includes(query) ||
            subjectCode.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Faculty Allocation</h1>
                    <p className="text-neutral-500 mt-1">Assign teachers to subjects with section and batch.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus size={18} />
                            New Allocation
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create Allocation</DialogTitle>
                            <DialogDescription>Assign a teacher to a subject with section and batch.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Academic Year *</Label>
                                <Select
                                    value={formData.academic_year}
                                    onValueChange={(val: string) => setFormData({ ...formData, academic_year: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ACADEMIC_YEARS.map((year) => (
                                            <SelectItem key={year} value={year}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Teacher *</Label>
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
                                                {teacher.employee_id} - {getTeacherName(teacher)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

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
                                                {subject.code} - {subject.name} {subject.semester ? `(Sem ${subject.semester})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Section & Batch - COMPULSORY */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Section *</Label>
                                    <Select
                                        value={formData.section}
                                        onValueChange={(val: string) => setFormData({ ...formData, section: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SECTIONS.map((sec) => (
                                                <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Batch</Label>
                                    <Select
                                        value={formData.batch}
                                        onValueChange={(val: string) => setFormData({ ...formData, batch: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select batch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="entire">
                                                <span className="font-medium">Entire Section</span>
                                            </SelectItem>
                                            {BATCHES.map((batch) => (
                                                <SelectItem key={batch} value={batch}>Batch {batch}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create Allocation</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <Input
                        placeholder="Search by teacher or subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Academic Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {ACADEMIC_YEARS.map((year) => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Allocation List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-neutral-400" size={32} />
                </div>
            ) : filteredAllocations.length === 0 ? (
                <Card className="p-12 text-center">
                    <ArrowRightLeft className="mx-auto text-neutral-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No allocations found</h3>
                    <p className="text-neutral-500 mt-2">
                        {searchQuery ? "Try adjusting your search." : `No allocations for ${filterYear}. Click 'New Allocation' to add.`}
                    </p>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAllocations.map((alloc) => (
                        <Card key={alloc.id} className="p-4 group hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                        <GraduationCap size={20} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                            {getTeacherName(alloc.teachers)}
                                        </h3>
                                        <p className="text-sm text-neutral-500">{alloc.teachers?.employee_id || "No ID"}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDelete(alloc.id)}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-md">
                                <Book size={16} className="text-neutral-500" />
                                <div className="flex-1">
                                    <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                                        {alloc.subjects?.code} - {alloc.subjects?.name}
                                    </p>
                                    <div className="flex gap-2 text-xs text-neutral-500 mt-0.5">
                                        {alloc.subjects?.semester && <span>Sem {alloc.subjects.semester}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Section & Batch Display */}
                            <div className="flex gap-2 mt-3">
                                {alloc.section && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                                        <Users size={12} />
                                        Section {alloc.section}
                                    </span>
                                )}
                                {alloc.batch ? (
                                    <span className="px-2 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
                                        Batch {alloc.batch}
                                    </span>
                                ) : alloc.section && (
                                    <span className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                        Entire Section
                                    </span>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

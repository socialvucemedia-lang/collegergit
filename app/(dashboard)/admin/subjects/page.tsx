"use client";

import { useState, useEffect, useRef } from "react";
import {
    Plus,
    Search,
    Book,
    Trash2,
    Pencil,
    X,
    Loader2,
    Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Department {
    id: string;
    code: string;
    name: string;
}

interface Subject {
    id: string;
    code: string;
    name: string;
    department_id: string | null;
    semester: number | null;
    credits: number | null;
    departments: Department | null;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterDept, setFilterDept] = useState("all");
    const [filterSem, setFilterSem] = useState("all");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        department_id: "",
        semester: "",
        credits: "",
    });

    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ---------------- FETCHING ---------------- */

    useEffect(() => {
        fetchSubjects();
        fetchDepartments();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/subjects");
            const data = await res.json();
            setSubjects(data.subjects || []);
        } catch {
            toast.error("Failed to load subjects");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/departments");
            const data = await res.json();
            setDepartments(data.departments || []);
        } catch {
            toast.error("Failed to load departments");
        }
    };

    /* ---------------- CSV IMPORT ---------------- */

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);

            const res = await fetch("/api/subjects/import", {
                method: "POST",
                body: fd,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error);

            toast.success(`Imported ${result.imported} subjects`);
            fetchSubjects();
        } catch (err: any) {
            toast.error(err.message || "Import failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    /* ---------------- FORM ---------------- */

    const resetForm = () => {
        setEditingSubject(null);
        setFormData({
            code: "",
            name: "",
            department_id: "",
            semester: "",
            credits: "",
        });
    };

    const openEditDialog = (subject: Subject) => {
        setEditingSubject(subject);
        setFormData({
            code: subject.code,
            name: subject.name,
            department_id: subject.department_id || "",
            semester: subject.semester?.toString() || "",
            credits: subject.credits?.toString() || "",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingSubject
                ? `/api/subjects/${editingSubject.id}`
                : "/api/subjects";

            const method = editingSubject ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    department_id: formData.department_id || null,
                    semester: formData.semester || null,
                    credits: formData.credits || null,
                }),
            });

            if (!res.ok) throw new Error();

            toast.success(editingSubject ? "Subject updated" : "Subject created");
            setIsDialogOpen(false);
            resetForm();
            fetchSubjects();
        } catch {
            toast.error("Failed to save subject");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this subject?")) return;

        try {
            await fetch(`/api/subjects/${id}`, { method: "DELETE" });
            toast.success("Subject deleted");
            fetchSubjects();
        } catch {
            toast.error("Delete failed");
        }
    };

    /* ---------------- FILTER ---------------- */

    const filteredSubjects = subjects.filter((s) => {
        const search =
            s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.name.toLowerCase().includes(searchQuery.toLowerCase());

        const dept = filterDept === "all" || s.department_id === filterDept;
        const sem = filterSem === "all" || s.semester?.toString() === filterSem;

        return search && dept && sem;
    });

    /* ---------------- RENDER ---------------- */

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Subject Management</h1>
                    <p className="text-neutral-500">
                        Create and manage subjects for departments and semesters.
                    </p>
                </div>

                <div className="flex gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                    />

                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Upload size={16} className="mr-2" />
                        {uploading ? "Importing..." : "Import CSV"}
                    </Button>

                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) resetForm();
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <Plus size={16} className="mr-2" />
                                Add Subject
                            </Button>
                        </DialogTrigger>

                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingSubject ? "Edit Subject" : "Add Subject"}
                                </DialogTitle>
                                <DialogDescription>
                                    Enter subject details below
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Code</Label>
                                        <Input
                                            required
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({ ...formData, code: e.target.value })
                                            }
                                            placeholder="e.g. CS101"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Credits</Label>
                                        <Input
                                            type="number"
                                            value={formData.credits}
                                            onChange={(e) =>
                                                setFormData({ ...formData, credits: e.target.value })
                                            }
                                            placeholder="3"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="e.g. Data Structures"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Select
                                            value={formData.department_id}
                                            onValueChange={(v) =>
                                                setFormData({ ...formData, department_id: v })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.code} - {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Semester</Label>
                                        <Select
                                            value={formData.semester}
                                            onValueChange={(v) =>
                                                setFormData({ ...formData, semester: v })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Semester" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SEMESTERS.map((s) => (
                                                    <SelectItem key={s} value={s.toString()}>
                                                        Semester {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingSubject ? "Update" : "Create"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* FILTERS */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <Input
                        placeholder="Search by code or name..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={filterDept} onValueChange={setFilterDept}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.code}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterSem} onValueChange={setFilterSem}>
                    <SelectTrigger className="w-full md:w-[150px]">
                        <SelectValue placeholder="All Semesters" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Semesters</SelectItem>
                        {SEMESTERS.map((s) => (
                            <SelectItem key={s} value={s.toString()}>Sem {s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {(filterDept !== "all" || filterSem !== "all") && (
                    <Button variant="ghost" onClick={() => { setFilterDept("all"); setFilterSem("all"); }}>
                        <X size={16} className="mr-1" /> Clear
                    </Button>
                )}
            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-neutral-400" size={32} />
                </div>
            ) : filteredSubjects.length === 0 ? (
                <Card className="p-12 text-center">
                    <Book className="mx-auto mb-4 text-neutral-300" size={48} />
                    <h3 className="text-lg font-medium">No subjects found</h3>
                    <p className="text-neutral-500">Try adjusting your filters.</p>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSubjects.map((s) => (
                        <Card key={s.id} className="p-4 group hover:border-neutral-400 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                    {s.code}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(s)}>
                                        <Pencil size={14} />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(s.id)}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                            <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 mb-3">{s.name}</h3>
                            <div className="flex flex-wrap gap-2">
                                {s.departments && (
                                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium">
                                        {s.departments.code}
                                    </span>
                                )}
                                {s.semester && (
                                    <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium">
                                        Sem {s.semester}
                                    </span>
                                )}
                                {s.credits && (
                                    <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full font-medium">
                                        {s.credits} Credits
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

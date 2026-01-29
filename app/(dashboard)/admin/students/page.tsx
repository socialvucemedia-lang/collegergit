"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Users, ArrowRight, Check, X, Loader2, AlertTriangle, GraduationCap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Student {
    id: string;
    roll_number: string;
    semester: number;
    name: string;
    email: string;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StudentsPage() {
    const [activeTab, setActiveTab] = useState<'import' | 'promote' | 'departments'>('import');
    const [uploading, setUploading] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [fromSem, setFromSem] = useState<string>("1");
    const [toSem, setToSem] = useState<string>("2");
    const [retainIds, setRetainIds] = useState<Set<string>>(new Set());
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState<string>("");
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [assigning, setAssigning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeTab === 'promote') {
            fetchStudentsBySemester();
        }
    }, [activeTab, fromSem]);

    useEffect(() => {
        if (activeTab === 'departments') {
            fetchUnassignedStudents();
            fetchDepartments();
        }
    }, [activeTab]);

    const fetchStudentsBySemester = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/students?semester=${fromSem}`);
            if (response.ok) {
                const data = await response.json();
                setStudents(data.students || []);
                setRetainIds(new Set()); // Reset selections
            }
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await fetch('/api/departments');
            if (response.ok) {
                const data = await response.json();
                setDepartments(data.departments || []);
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    };

    const fetchUnassignedStudents = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/students?unassigned=true`);
            if (response.ok) {
                const data = await response.json();
                setStudents(data.students || []);
                setSelectedStudents(new Set()); // Reset selections
            }
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAssign = async () => {
        if (!selectedDept) {
            toast.error("Please select a department");
            return;
        }
        if (selectedStudents.size === 0) {
            toast.error("Please select at least one student");
            return;
        }

        setAssigning(true);
        try {
            const response = await fetch('/api/students', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_ids: Array.from(selectedStudents),
                    department_id: selectedDept
                }),
            });

            if (!response.ok) throw new Error("Failed to assign department");

            toast.success(`Assigned ${selectedStudents.size} students to department!`);
            fetchUnassignedStudents(); // Refresh list
        } catch (error) {
            toast.error("Failed to assign department");
        } finally {
            setAssigning(false);
        }
    };

    const toggleStudentSelection = (id: string) => {
        setSelectedStudents(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAllUnassigned = () => {
        if (selectedStudents.size === students.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(students.map(s => s.id)));
        }
    };

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/students/import', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Import failed');
            }

            toast.success(`Created ${result.created} student accounts!`);
            if (result.errors?.length) {
                toast.warning(`${result.errors.length} rows had issues`);
                console.log('Import errors:', result.errors);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to import students');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const toggleRetain = (studentId: string) => {
        setRetainIds((prev) => {
            const next = new Set(prev);
            if (next.has(studentId)) {
                next.delete(studentId);
            } else {
                next.add(studentId);
            }
            return next;
        });
    };

    const handlePromotion = async () => {
        if (!confirm(`Promote ${students.length - retainIds.size} students from Sem ${fromSem} to Sem ${toSem}?`)) {
            return;
        }

        setPromoting(true);
        try {
            const response = await fetch('/api/students/promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_semester: parseInt(fromSem),
                    to_semester: parseInt(toSem),
                    retain_ids: Array.from(retainIds),
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Promotion failed');
            }

            toast.success(`Promoted ${result.promoted} students! ${result.retained} retained.`);
            fetchStudentsBySemester();
        } catch (error: any) {
            toast.error(error.message || 'Failed to promote students');
        } finally {
            setPromoting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Student Management</h1>
                <p className="text-neutral-500 mt-1">Import students and manage semester promotions.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
                <button
                    onClick={() => setActiveTab('import')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'import'
                        ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    Bulk Import
                </button>
                <button
                    onClick={() => setActiveTab('promote')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'promote'
                        ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    Semester Promotion
                </button>
                <button
                    onClick={() => setActiveTab('departments')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'departments'
                        ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    Department Assignment
                </button>
            </div>

            {activeTab === 'import' && (
                <Card className="p-8">
                    <div className="text-center max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <Upload className="text-blue-600 dark:text-blue-400" size={28} />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Import Students from CSV</h2>
                        <p className="text-neutral-500 text-sm mb-6">
                            Upload a CSV file with columns: <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">email, full_name, roll_number, semester, section, batch, department, password</code>
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleCSVUpload}
                            accept=".csv"
                            className="hidden"
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="gap-2"
                        >
                            {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                            {uploading ? 'Importing...' : 'Choose CSV File'}
                        </Button>
                    </div>
                </Card>
            )}

            {activeTab === 'promote' && (
                <div className="space-y-6">
                    {/* Semester Selection */}
                    <Card className="p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Label>From Semester:</Label>
                                <Select value={fromSem} onValueChange={(v) => { setFromSem(v); setToSem((parseInt(v) + 1).toString()); }}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SEMESTERS.slice(0, -1).map((sem) => (
                                            <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <ArrowRight className="text-neutral-400" />
                            <div className="flex items-center gap-2">
                                <Label>To Semester:</Label>
                                <Select value={toSem} onValueChange={setToSem}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SEMESTERS.filter((s) => s > parseInt(fromSem)).map((sem) => (
                                            <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1" />
                            <Button
                                onClick={handlePromotion}
                                disabled={promoting || students.length === 0}
                                className="gap-2"
                            >
                                {promoting ? <Loader2 className="animate-spin" size={18} /> : <GraduationCap size={18} />}
                                Promote {students.length - retainIds.size} Students
                            </Button>
                        </div>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card className="p-4">
                            <p className="text-sm text-neutral-500">Total in Sem {fromSem}</p>
                            <p className="text-2xl font-bold">{students.length}</p>
                        </Card>
                        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-600 dark:text-green-400">To Promote</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{students.length - retainIds.size}</p>
                        </Card>
                        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-600 dark:text-red-400">Failed / Retained</p>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{retainIds.size}</p>
                        </Card>
                    </div>

                    {/* Student List */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-neutral-400" size={32} />
                        </div>
                    ) : students.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Users className="mx-auto text-neutral-300 mb-4" size={48} />
                            <p className="text-neutral-500">No students found in Semester {fromSem}.</p>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm text-neutral-500 mb-2">
                                Click on students to mark as <span className="text-red-600 font-medium">Failed/Retain</span>.
                            </p>
                            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                {students.map((student) => {
                                    const isRetained = retainIds.has(student.id);
                                    return (
                                        <Card
                                            key={student.id}
                                            onClick={() => toggleRetain(student.id)}
                                            className={`p-3 cursor-pointer transition-all ${isRetained
                                                ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-800'
                                                : 'hover:border-neutral-400 dark:hover:border-neutral-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isRetained
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                                                    }`}>
                                                    {isRetained ? <X size={16} /> : student.roll_number.slice(-2)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{student.name}</p>
                                                    <p className="text-xs text-neutral-500">{student.roll_number}</p>
                                                </div>
                                                {isRetained && (
                                                    <span className="text-xs font-medium text-red-600 dark:text-red-400">RETAIN</span>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'departments' && (
                <div className="space-y-6">
                    <Card className="p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <Label className="mb-2 block">Assign Department To Selected:</Label>
                                <Select value={selectedDept} onValueChange={setSelectedDept}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name} ({dept.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleBulkAssign}
                                    disabled={assigning || selectedDept === "" || selectedStudents.size === 0}
                                    className="gap-2"
                                >
                                    {assigning ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                    Assign to {selectedStudents.size} Students
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Unassigned Students ({students.length})</h3>
                        <Button variant="outline" size="sm" onClick={selectAllUnassigned}>
                            {selectedStudents.size === students.length ? "Deselect All" : "Select All"}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-neutral-400" size={32} />
                        </div>
                    ) : students.length === 0 ? (
                        <Card className="p-12 text-center">
                            <CheckCircle2 className="mx-auto text-green-500 mb-4" size={48} />
                            <p className="text-neutral-500">All students have been assigned departments!</p>
                        </Card>
                    ) : (
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {students.map((student) => {
                                const isSelected = selectedStudents.has(student.id);
                                return (
                                    <Card
                                        key={student.id}
                                        onClick={() => toggleStudentSelection(student.id)}
                                        className={`p-3 cursor-pointer transition-all ${isSelected
                                            ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-800'
                                            : 'hover:border-neutral-400 dark:hover:border-neutral-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSelected
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                                                }`}>
                                                {isSelected ? <Check size={16} /> : student.roll_number.slice(-2)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{student.name}</p>
                                                <p className="text-xs text-neutral-500">{student.roll_number}</p>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

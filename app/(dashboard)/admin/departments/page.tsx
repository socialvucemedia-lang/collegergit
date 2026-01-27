"use client";

import { useState, useEffect } from "react";
import { Plus, Building2, Trash2, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Department {
    id: string;
    code: string;
    name: string;
    description: string | null;
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/departments");
            if (response.ok) {
                const data = await response.json();
                setDepartments(data.departments || []);
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
            toast.error("Failed to load departments");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingDept ? `/api/departments/${editingDept.id}` : "/api/departments";
            const method = editingDept ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to save department");
            }

            toast.success(editingDept ? "Department updated!" : "Department created!");
            setIsDialogOpen(false);
            resetForm();
            fetchDepartments();
        } catch (error: any) {
            toast.error(error.message || "Failed to save department");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this department?")) return;
        try {
            const response = await fetch(`/api/departments/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete");
            toast.success("Department deleted!");
            fetchDepartments();
        } catch (error) {
            toast.error("Failed to delete department");
        }
    };

    const openEditDialog = (dept: Department) => {
        setEditingDept(dept);
        setFormData({
            code: dept.code,
            name: dept.name,
            description: dept.description || "",
        });
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingDept(null);
        setFormData({ code: "", name: "", description: "" });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Departments</h1>
                    <p className="text-neutral-500 mt-1">Manage academic departments.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus size={18} />
                            Add Department
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingDept ? "Edit Department" : "Add New Department"}</DialogTitle>
                            <DialogDescription>
                                {editingDept ? "Update the department details." : "Create a new academic department."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Department Code *</Label>
                                    <Input
                                        id="code"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="CS"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Department Name *</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Computer Science"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">{editingDept ? "Update" : "Create"}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-neutral-400" size={32} />
                </div>
            ) : departments.length === 0 ? (
                <Card className="p-12 text-center">
                    <Building2 className="mx-auto text-neutral-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No departments found</h3>
                    <p className="text-neutral-500 mt-2">Add your first department to get started.</p>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {departments.map((dept) => (
                        <Card key={dept.id} className="p-4 group hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(dept)}>
                                        <Pencil size={14} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(dept.id)}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="font-mono text-sm bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-800 dark:text-neutral-200">
                                    {dept.code}
                                </span>
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mt-2">{dept.name}</h3>
                                {dept.description && (
                                    <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{dept.description}</p>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

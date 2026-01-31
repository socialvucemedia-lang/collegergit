"use client";

import { useState, useEffect } from "react";
import { UserCog, Plus, Search, Mail, GraduationCap, Users, ShieldCheck, User, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { UserRole } from "@/types/database";

interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}

interface Student {
  id: string;
  user_id: string;
  roll_number: string;
  semester: number | null;
  department_id: string | null;
  section: string | null;
  batch: string | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Map<string, Student>>(new Map());
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "student" as UserRole,
    roll_number: "",
    employee_id: "",
    department_id: "",
    section: "",
    batch: "",
  });

  // Fetch users and students
  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/students");
      if (response.ok) {
        const data = await response.json();
        // Get all users - we need to create an endpoint for this or fetch from Supabase
        // For now, let's fetch students and teachers separately
        await Promise.all([fetchStudents(), fetchAllUsers()]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        if (data.users) setUsers(data.users);
      }
    } catch (error: any) {
      console.error("Error fetching all users:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students");
      if (response.ok) {
        const data = await response.json();
        const studentsMap = new Map<string, Student>();
        data.students?.forEach((student: any) => {
          studentsMap.set(student.user_id, student);
        });
        setStudents(studentsMap);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload: any = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
      };

      if (formData.role === "student") {
        if (!formData.roll_number) throw new Error("Roll Number is required for students");
        payload.roll_number = formData.roll_number;

        if (formData.department_id) payload.department_id = formData.department_id;
        if (formData.section) payload.section = formData.section.toUpperCase();
        if (formData.batch) payload.batch = formData.batch.toUpperCase();
      }

      if (formData.role === "teacher" && formData.employee_id) {
        payload.employee_id = formData.employee_id;
        if (formData.department_id) payload.department_id = formData.department_id;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      toast.success(`User created successfully!`);
      setIsDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    }
  };

  const handleUpdateStudent = async (studentId: string, updates: Partial<Student>) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update student");
      toast.success("Student updated successfully!");
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || "Failed to update student");
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      full_name: "",
      role: "student",
      roll_number: "",
      employee_id: "",
      department_id: "",
      section: "",
      batch: "",
    });
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    students.get(user.id)?.roll_number.includes(searchQuery)
  );

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <ShieldCheck size={16} className="text-purple-600" />;
      case "teacher":
        return <GraduationCap size={16} className="text-blue-600" />;
      case "advisor":
        return <Users size={16} className="text-green-600" />;
      case "student":
        return <User size={16} className="text-orange-600" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "teacher":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "advisor":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "student":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">User Management</h1>
          <p className="text-neutral-500 mt-1">Create and manage user accounts, roles, and assignments.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={18} />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account with email and password. The user will be able to login immediately.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg space-y-4 border border-neutral-100 dark:border-neutral-800">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(val) => setFormData({ ...formData, role: val as UserRole })}
                  >
                    <SelectTrigger className="bg-white dark:bg-neutral-950">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="advisor">Advisor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === "student" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="roll_number">Roll Number *</Label>
                      <Input
                        id="roll_number"
                        required
                        value={formData.roll_number}
                        onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                        placeholder="201"
                        className="bg-white dark:bg-neutral-950"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dept">Department</Label>
                      <Select
                        value={formData.department_id}
                        onValueChange={(val) => setFormData({ ...formData, department_id: val })}
                      >
                        <SelectTrigger className="bg-white dark:bg-neutral-950">
                          <SelectValue placeholder="Select Dept" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section">Division (Section)</Label>
                      <Input
                        id="section"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        placeholder="A, B, C..."
                        className="bg-white dark:bg-neutral-950"
                        maxLength={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batch">Batch</Label>
                      <Input
                        id="batch"
                        value={formData.batch}
                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                        placeholder="B1, B2..."
                        className="bg-white dark:bg-neutral-950"
                        maxLength={5}
                      />
                    </div>
                  </div>
                )}

                {formData.role === "teacher" && (
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Employee ID</Label>
                    <Input
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      placeholder="EMP001"
                      className="bg-white dark:bg-neutral-950"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
        <Input
          placeholder="Search by email, name, or roll number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-neutral-400" size={32} />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <UserCog className="mx-auto text-neutral-400 mb-4" size={48} />
          <p className="text-neutral-500">No users found. Create your first user to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => {
            const student = students.get(user.id);
            return (
              <Card key={user.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {user.full_name || "No name"}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                        <div className="flex items-center gap-1">
                          <Mail size={14} />
                          {user.email}
                        </div>
                        {student && (
                          <div className="flex items-center gap-3">
                            <span className="font-medium">Roll: {student.roll_number}</span>
                            {student.section && <span className="bg-neutral-100 px-1.5 rounded text-xs">Div: {student.section}</span>}
                            {student.batch && <span className="bg-neutral-100 px-1.5 rounded text-xs">Batch: {student.batch}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role === "student" && student && (
                      <EditStudentDialog
                        student={student}
                        departments={departments}
                        onUpdate={(updates) => handleUpdateStudent(student.id, updates)}
                      />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditStudentDialog({
  student,
  departments,
  onUpdate,
}: {
  student: Student;
  departments: Department[];
  onUpdate: (updates: Partial<Student>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({
    roll_number: student.roll_number,
    department_id: student.department_id || "",
    section: student.section || "",
    batch: student.batch || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.roll_number.trim()) {
      toast.error("Roll number is required");
      return;
    }

    // Convert empty strings to null for DB consistency
    const updates: any = {
      roll_number: data.roll_number,
      department_id: data.department_id || null,
      section: data.section ? data.section.toUpperCase() : null,
      batch: data.batch ? data.batch.toUpperCase() : null,
    };

    onUpdate(updates);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit size={14} />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Student Details</DialogTitle>
          <DialogDescription>
            Update roll number, department, division, and batch.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_roll">Roll Number *</Label>
            <Input
              id="edit_roll"
              required
              value={data.roll_number}
              onChange={(e) => setData({ ...data, roll_number: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_dept">Department</Label>
            <Select
              value={data.department_id || "none"}
              onValueChange={(val) => setData({ ...data, department_id: val === "none" ? "" : val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Dept" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Department</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_section">Division</Label>
              <Input
                id="edit_section"
                value={data.section}
                onChange={(e) => setData({ ...data, section: e.target.value })}
                placeholder="A"
                maxLength={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_batch">Batch</Label>
              <Input
                id="edit_batch"
                value={data.batch}
                onChange={(e) => setData({ ...data, batch: e.target.value })}
                placeholder="B1"
                maxLength={5}
              />
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

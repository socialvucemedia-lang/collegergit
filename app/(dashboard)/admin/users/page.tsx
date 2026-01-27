"use client";

import { useState, useEffect } from "react";
import { UserCog, Plus, Search, Mail, GraduationCap, Users, ShieldCheck, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Map<string, Student>>(new Map());
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
    semester: "",
  });

  // Fetch users and students
  useEffect(() => {
    fetchUsers();
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload: any = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
      };

      if (formData.role === "student" && formData.roll_number) {
        payload.roll_number = formData.roll_number;
      }

      if (formData.role === "teacher" && formData.employee_id) {
        payload.employee_id = formData.employee_id;
      }

      if (formData.department_id) {
        payload.department_id = formData.department_id;
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

  const handleAssignRollNumber = async (userId: string, rollNumber: string) => {
    try {
      // First check if student record exists
      const studentRecord = Array.from(students.values()).find(s => s.user_id === userId);
      
      if (studentRecord) {
        // Update existing student record
        const response = await fetch(`/api/students/${studentRecord.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roll_number: rollNumber }),
        });

        if (!response.ok) throw new Error("Failed to update roll number");
        toast.success("Roll number updated!");
      } else {
        // Create new student record
        const { supabase } = await import("@/lib/supabase");
        const { error } = await supabase
          .from("students")
          .insert({
            user_id: userId,
            roll_number: rollNumber,
          });

        if (error) throw error;
        toast.success("Roll number assigned!");
      }

      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign roll number");
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
      semester: "",
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

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="advisor">Advisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formData.role === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="roll_number">Roll Number *</Label>
                  <Input
                    id="roll_number"
                    required
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    placeholder="201"
                  />
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
                  />
                </div>
              )}

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
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Roll: {student.roll_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role === "student" && (
                      <AssignRollNumberDialog
                        userId={user.id}
                        currentRollNumber={student?.roll_number}
                        onAssign={handleAssignRollNumber}
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

function AssignRollNumberDialog({
  userId,
  currentRollNumber,
  onAssign,
}: {
  userId: string;
  currentRollNumber?: string;
  onAssign: (userId: string, rollNumber: string) => void;
}) {
  const [rollNumber, setRollNumber] = useState(currentRollNumber || "");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim()) {
      toast.error("Roll number is required");
      return;
    }
    onAssign(userId, rollNumber);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {currentRollNumber ? "Update Roll" : "Assign Roll"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{currentRollNumber ? "Update Roll Number" : "Assign Roll Number"}</DialogTitle>
          <DialogDescription>
            {currentRollNumber
              ? `Current roll number: ${currentRollNumber}`
              : "Assign a roll number to this student"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roll">Roll Number</Label>
            <Input
              id="roll"
              required
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="201"
            />
          </div>
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{currentRollNumber ? "Update" : "Assign"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

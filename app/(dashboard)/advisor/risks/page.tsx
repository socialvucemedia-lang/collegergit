"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, User, Mail, TrendingDown, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AtRiskStudent {
    id: string;
    roll_number: string;
    name: string;
    email: string;
    semester: number | null;
    department: string | null;
    total_classes: number;
    attended: number;
    percentage: number | null;
}

export default function RiskDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(75);
    const [data, setData] = useState<{
        at_risk_count: number;
        total_students: number;
        students: AtRiskStudent[];
    } | null>(null);

    useEffect(() => {
        fetchRiskData();
    }, []);

    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null);
    const [noteText, setNoteText] = useState("");
    const [actionType, setActionType] = useState("");

    const handleAddNote = async () => {
        if (!selectedStudent || !noteText) return;

        try {
            const response = await fetch("/api/advisor/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: selectedStudent.id,
                    note: noteText,
                    action_taken: actionType || null,
                }),
            });

            if (!response.ok) throw new Error("Failed to add note");

            toast.success("Intervention note added!");
            setIsNoteOpen(false);
            setNoteText("");
            setActionType("");
        } catch (error) {
            toast.error("Failed to add note");
        }
    };

    const fetchRiskData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/advisor/risks?threshold=${threshold}`);
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error("Error fetching risk data:", error);
            toast.error("Failed to load risk data");
        } finally {
            setLoading(false);
        }
    };

    const getAttendanceColor = (percentage: number | null) => {
        if (percentage === null) return "text-neutral-400";
        if (percentage < 50) return "text-red-600 dark:text-red-400";
        if (percentage < 75) return "text-orange-600 dark:text-orange-400";
        return "text-yellow-600 dark:text-yellow-400";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">At-Risk Students</h1>
                    <p className="text-neutral-500 mt-1">Monitor students below attendance threshold for intervention.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="threshold" className="text-sm text-neutral-500">Threshold:</Label>
                        <Input
                            id="threshold"
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value) || 75)}
                            className="w-20 h-9"
                            min={50}
                            max={100}
                        />
                        <span className="text-neutral-400">%</span>
                    </div>
                    <Button onClick={fetchRiskData} variant="outline" className="gap-2">
                        <RefreshCw size={16} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-sm">
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">At Risk</p>
                        <p className="text-3xl font-bold text-red-700 dark:text-red-300">{data.at_risk_count}</p>
                    </Card>
                    <Card className="p-4 shadow-sm border">
                        <p className="text-sm text-neutral-500 font-medium mb-1">Total Students</p>
                        <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{data.total_students}</p>
                    </Card>
                    <Card className="p-4 shadow-sm border">
                        <p className="text-sm text-neutral-500 font-medium mb-1">Risk Rate</p>
                        <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                            {data.total_students > 0 ? Math.round((data.at_risk_count / data.total_students) * 100) : 0}%
                        </p>
                    </Card>
                    <Card className="p-4 shadow-sm border bg-neutral-50 dark:bg-neutral-900/50">
                        <p className="text-sm text-neutral-500 font-medium mb-1">Threshold</p>
                        <p className="text-3xl font-bold text-neutral-700 dark:text-neutral-300">&lt; {threshold}%</p>
                    </Card>
                </div>
            )}

            {/* Student List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-neutral-400" size={32} />
                </div>
            ) : !data || data.students.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <TrendingDown className="text-green-600 dark:text-green-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No At-Risk Students</h3>
                    <p className="text-neutral-500 mt-2">
                        All students are currently above the {threshold}% attendance threshold.
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {data.students.map((student) => (
                        <Card key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border shadow-sm hover:shadow hover:border-red-200 dark:hover:border-red-900 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="text-red-500" size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-red-600 transition-colors">
                                            {student.name}
                                        </h3>
                                        <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 px-1.5 py-0.5 rounded">
                                            {student.roll_number}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 mt-1">
                                        {student.email && (
                                            <span className="flex items-center gap-1.5">
                                                <Mail size={12} />
                                                {student.email}
                                            </span>
                                        )}
                                        {(student.semester || student.department) && (
                                            <span className="text-xs border-l pl-3 border-neutral-200 dark:border-neutral-800">
                                                {student.semester && `Sem ${student.semester}`}
                                                {student.department && ` • ${student.department}`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6 pl-16 sm:pl-0 w-full sm:w-auto">
                                <div className="text-right">
                                    <p className={`text-2xl font-bold ${getAttendanceColor(student.percentage)}`}>
                                        {student.percentage !== null ? `${student.percentage}%` : 'N/A'}
                                    </p>
                                    <p className="text-xs text-neutral-400 font-medium">
                                        {student.attended}/{student.total_classes} classes
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    onClick={() => {
                                        setSelectedStudent(student);
                                        setIsNoteOpen(true);
                                    }}
                                >
                                    Log Note
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Intervention Note</DialogTitle>
                        <DialogDescription>
                            Log action taken for {selectedStudent?.name} ({selectedStudent?.roll_number})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Note</Label>
                            <Input
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="E.g. Met with student, Emailed parents..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Action Taken (Optional)</Label>
                            <Select value={actionType} onValueChange={setActionType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select action type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="meeting">Meeting</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="call">Phone Call</SelectItem>
                                    <SelectItem value="warning">Official Warning</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsNoteOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddNote}>Save Note</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}


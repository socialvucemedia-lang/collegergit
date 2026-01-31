"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Subject {
    subject_id: string;
    subject_name: string;
    subject_code: string;
    semester: number;
    department: string | null;
}

export default function TeacherReportsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [section, setSection] = useState<string>("all");
    const [batch, setBatch] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/teacher/reports');
            if (res.ok) {
                const data = await res.json();
                // The API returns { subjects: [...] }
                setSubjects(data.subjects || []);
            } else {
                toast.error("Failed to load subjects");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error loading subjects");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedSubject) return;

        setDownloading(true);
        try {
            const queryParams = new URLSearchParams({
                subject_id: selectedSubject,
                section: section === 'all' ? '' : section,
                batch: batch === 'all' ? '' : batch
            });

            // Trigger download via direct navigation or fetch blob
            const response = await fetch(`/api/teacher/reports/download?${queryParams.toString()}`);

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Download failed");
            }

            // Create blob and force download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Try to get filename from headers
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'report.csv';
            if (contentDisposition) {
                const parts = contentDisposition.split('filename=');
                if (parts.length === 2) {
                    filename = parts[1].replace(/"/g, '');
                }
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success("Report downloaded successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to download report");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    Subject Reports
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                    Download full semester attendance records for your subjects.
                </p>
            </div>

            <Card className="p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Select Subject
                    </label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose a subject..." />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map((sub) => (
                                <SelectItem key={sub.subject_id} value={sub.subject_id}>
                                    {sub.subject_code} - {sub.subject_name} (Sem {sub.semester})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Division (Section)
                        </label>
                        <Select value={section} onValueChange={setSection}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Division" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Entire Class</SelectItem>
                                <SelectItem value="A">Division A</SelectItem>
                                <SelectItem value="B">Division B</SelectItem>
                                <SelectItem value="C">Division C</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Batch
                        </label>
                        <Select value={batch} onValueChange={setBatch}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Batch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Entire Batch</SelectItem>
                                <SelectItem value="B1">Batch B1</SelectItem>
                                <SelectItem value="B2">Batch B2</SelectItem>
                                <SelectItem value="B3">Batch B3</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 text-blue-700 dark:text-blue-300 text-sm">
                    <FileText className="shrink-0 mt-0.5" size={18} />
                    <p>
                        This report includes the <strong>Roll Number</strong>, <strong>Name</strong>, <strong>Lecture Count</strong>, and <strong>Attendance Percentage</strong> for all students enrolled in this subject for the current semester.
                    </p>
                </div>

                <Button
                    className="w-full bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200"
                    size="lg"
                    disabled={!selectedSubject || downloading}
                    onClick={handleDownload}
                >
                    {downloading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating CSV...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV Report
                        </>
                    )}
                </Button>
            </Card>

            {subjects.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-neutral-400">
                    <AlertCircle size={32} className="mb-2" />
                    <p>No subjects assigned to you yet.</p>
                </div>
            )}
        </div>
    );
}

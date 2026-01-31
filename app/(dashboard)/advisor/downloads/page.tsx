
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

// Sample batches - in a real app, perhaps fetch these or use standard ones
// The user request mentioned B1, B2, B3
const BATCHES = ["B1", "B2", "B3", "A1", "A2", "A3"];

type ReportType = "full" | "batch" | "defaulter";

export default function DownloadsPage() {
    const [reportType, setReportType] = useState<ReportType>("full");
    const [selectedBatch, setSelectedBatch] = useState<string>("B1");
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const params = new URLSearchParams({
                type: reportType
            });

            if (reportType === "batch") {
                params.append("batch", selectedBatch);
            }

            const response = await fetch(`/api/advisor/reports?${params}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Download failed");
            }

            // Trigger file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const timestamp = new Date().toISOString().split('T')[0];
            let filename = `attendance_report_${reportType}_${timestamp}.csv`;
            if (reportType === "batch") {
                filename = `attendance_${selectedBatch}_${timestamp}.csv`;
            } else if (reportType === "defaulter") {
                filename = `defaulters_list_${timestamp}.csv`;
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success("Report downloaded successfully");
        } catch (error: any) {
            console.error("Download error:", error);
            toast.error(error.message || "Failed to download report");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Downloads</h1>
                <p className="text-neutral-500">Generate and download attendance reports</p>
            </div>

            <Card className="p-8 space-y-8 shadow-sm border max-w-2xl">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Report Type</Label>
                        <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                            <SelectTrigger className="h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full">Entire Class Attendance</SelectItem>
                                <SelectItem value="batch">Specific Batch Attendance</SelectItem>
                                <SelectItem value="defaulter">Defaulter List (Below 75%)</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="text-sm text-neutral-500 bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md border border-neutral-100 dark:border-neutral-800">
                            {reportType === "full" && "Download compilation of all subjects for the entire class."}
                            {reportType === "batch" && "Download attendance only for a specific batch."}
                            {reportType === "defaulter" && "List of students with aggregate attendance below 75%."}
                        </div>
                    </div>

                    {reportType === "batch" && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                            <Label className="text-base font-semibold">Select Batch</Label>
                            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                                <SelectTrigger className="h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {BATCHES.map(b => (
                                        <SelectItem key={b} value={b}>{b}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="pt-2">
                        <Button
                            className="w-full h-12 text-base font-medium transition-all shadow-sm hover:shadow active:scale-[0.98]"
                            onClick={handleDownload}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Generating Report...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-5 w-5" />
                                    Download CSV Report
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="max-w-2xl">
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg flex gap-4 text-blue-800 dark:text-blue-200">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full h-fit">
                        <FileSpreadsheet className="shrink-0" size={18} />
                    </div>
                    <div>
                        <p className="font-semibold mb-1 text-sm">About Reports</p>
                        <p className="opacity-90 text-sm leading-relaxed">
                            All generated reports include a detailed subject-wise breakdown of attendance percentages along with a final Total Aggregate score, ensuring complete transparency for academic review.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

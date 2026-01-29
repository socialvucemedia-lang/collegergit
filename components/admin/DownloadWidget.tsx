"use client";

import { Button } from "@/components/ui/button";
import { Download, FileDown, ShieldAlert, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function DownloadWidget() {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleDefaulterDownload = async () => {
        try {
            setIsLoading('defaulters');
            const response = await fetch('/api/reports/defaulters/export?threshold=75');
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `defaulters_list_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('Defaulter list downloaded successfully');
        } catch (error) {
            toast.error('Failed to download defaulter list');
        } finally {
            setIsLoading(null);
        }
    };

    const handleCompiledDownload = async (section: string) => {
        try {
            setIsLoading(section);
            const params = new URLSearchParams();
            params.append('semester', '4'); // Default semester, user can change via the full page
            if (section !== 'all') {
                params.append('section', section);
            }

            const response = await fetch(`/api/reports/compiled/export?${params.toString()}`);
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compiled_attendance_${section === 'all' ? 'all' : `sec_${section}`}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success(`Attendance report downloaded successfully`);
        } catch (error) {
            toast.error('Failed to download attendance report');
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                        <FileDown size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Compiled Attendance</h3>
                        <p className="text-xs text-neutral-500">Download section-wise reports</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    {['A', 'B', 'C', 'D'].map((section) => (
                        <Button
                            key={section}
                            variant="outline"
                            size="sm"
                            className="bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-500 transition-colors"
                            onClick={() => handleCompiledDownload(section)}
                            disabled={!!isLoading}
                        >
                            {isLoading === section ? (
                                <Loader2 size={14} className="mr-2 animate-spin" />
                            ) : (
                                <Download size={14} className="mr-2" />
                            )}
                            Sec {section}
                        </Button>
                    ))}
                </div>

                <Link href="/admin/reports/compiled">
                    <Button variant="ghost" size="sm" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        View Full Report →
                    </Button>
                </Link>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Defaulter&apos;s List</h3>
                        <p className="text-xs text-neutral-500">Students below 75% attendance</p>
                    </div>
                </div>

                <Button
                    variant="destructive"
                    className="w-full bg-red-600 hover:bg-red-700 mb-3"
                    onClick={handleDefaulterDownload}
                    disabled={!!isLoading}
                >
                    {isLoading === 'defaulters' ? (
                        <>
                            <Loader2 size={14} className="mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        'Download Global Defaulter List'
                    )}
                </Button>

                <Link href="/admin/reports/defaulters">
                    <Button variant="ghost" size="sm" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                        View Defaulters →
                    </Button>
                </Link>
            </div>
        </div>
    );
}

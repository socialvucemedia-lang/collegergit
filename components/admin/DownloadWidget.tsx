"use client";

import { Button } from "@/components/ui/button";
import { Download, FileDown, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DownloadWidget() {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleDownload = (type: string) => {
        setIsLoading(type);
        setTimeout(() => {
            setIsLoading(null);
            toast.success(`${type} downloaded successfully`);
        }, 1500);
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
                        <p className="text-xs text-neutral-500">Download Division-wise reports</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {['Div A', 'Div B', 'Div C'].map((div) => (
                        <Button
                            key={div}
                            variant="outline"
                            size="sm"
                            className="bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-500 transition-colors"
                            onClick={() => handleDownload(`Attendance Report - ${div}`)}
                            disabled={!!isLoading}
                        >
                            <Download size={14} className="mr-2" />
                            {div}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Defaulter's List</h3>
                        <p className="text-xs text-neutral-500">Students below 75% attendance</p>
                    </div>
                </div>

                <Button
                    variant="destructive"
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => handleDownload('Defaulter List - All Divisions')}
                    disabled={!!isLoading}
                >
                    {isLoading === 'Defaulter List - All Divisions' ? 'Generating...' : 'Download Global Defaulter List'}
                </Button>
            </div>
        </div>
    );
}

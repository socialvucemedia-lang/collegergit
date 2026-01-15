"use client";

import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function ExportPage() {
    const [status, setStatus] = useState("Preparing data...");

    useEffect(() => {
        setTimeout(() => setStatus("Generating CSV..."), 1000);
        setTimeout(() => setStatus("Download ready."), 3000);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                <FileDown size={48} />
            </div>
            <div className="max-w-md space-y-2">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Export Reports</h1>
                <p className="text-neutral-500 font-mono text-sm">
                    {status === "Download ready." ? "Your file is ready for download." : status}
                </p>
            </div>
            {status !== "Download ready." && (
                <Loader2 className="animate-spin text-neutral-400" size={24} />
            )}

            <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
        </div>
    );
}

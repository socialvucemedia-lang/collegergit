"use client";

import { ArrowRightLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AllocationPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
            <div className="w-24 h-24 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400">
                <ArrowRightLeft size={48} />
            </div>
            <div className="max-w-md space-y-2">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Faculty Allocation</h1>
                <p className="text-neutral-500">
                    This interface will facilitate subject load distribution, temporary faculty substitution, and cross-departmental assignments.
                </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm font-mono text-neutral-600 dark:text-neutral-400">
                <AlertCircle size={16} />
                <span>Module under active development</span>
            </div>
            <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
        </div>
    );
}

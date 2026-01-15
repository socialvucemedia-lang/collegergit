"use client";

import { UserCog, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UsersPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                <UserCog size={48} />
            </div>
            <div className="max-w-md space-y-2">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">User Management</h1>
                <p className="text-neutral-500">
                    Centralized directory for managing Student, Faculty, and Staff credentials, roles, and access permissions.
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

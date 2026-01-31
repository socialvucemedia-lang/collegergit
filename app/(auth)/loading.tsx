import { Loader2 } from "lucide-react";

export default function AuthLoading() {
    return (
        <div className="flex h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                <p className="text-sm text-neutral-500">Loading...</p>
            </div>
        </div>
    );
}

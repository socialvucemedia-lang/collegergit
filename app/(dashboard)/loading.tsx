import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                <p className="text-sm text-neutral-500">Loading...</p>
            </div>
        </div>
    );
}

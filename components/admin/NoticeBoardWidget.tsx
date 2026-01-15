"use client";

import { Button } from "@/components/ui/button";
import { CalendarPlus, Megaphone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function NoticeBoardWidget() {
    const [notice, setNotice] = useState("");

    const handlePost = () => {
        if (!notice.trim()) return;
        toast.success("Notice posted to all student dashboards");
        setNotice("");
    };

    return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg dark:bg-orange-900/30 dark:text-orange-400">
                        <Megaphone size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Quick Notice</h3>
                        <p className="text-xs text-neutral-500">Post announcements to dashboards</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-[120px]">
                <textarea
                    className="w-full h-full p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400 text-sm"
                    placeholder="Type your announcement here (e.g., 'Tomorrow's lecture moved to Hall 4')..."
                    value={notice}
                    onChange={(e) => setNotice(e.target.value)}
                />
            </div>

            <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 gap-2" size="sm">
                    <CalendarPlus size={16} />
                    Add Event
                </Button>
                <Button className="flex-1 gap-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" size="sm" onClick={handlePost}>
                    <Send size={16} />
                    Post Now
                </Button>
            </div>
        </div>
    );
}

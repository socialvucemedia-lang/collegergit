"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";

export default function TimetablePage() {
    const schedule = [
        { id: 1, time: "08:30 AM", subject: "Engineering Graphics (EG)", type: "Lecture", room: "B-21", status: "Conducted", teacher: "Prof. RNS" },
        { id: 2, time: "09:30 AM", subject: "AM-II", type: "Lecture", room: "B-21", status: "Conducted", teacher: "Prof. BBS" },
        { id: 3, time: "10:30 AM", subject: "Data Structures (DS - B2)", type: "Lab", room: "C-61", status: "Conducted", teacher: "Prof. SB" },
        { id: 4, time: "11:30 AM", subject: "EC (B3/B1) / EP (B1/B3)", type: "Lecture", room: "YSP", status: "Upcoming", teacher: "PSD / YSP" },
        { id: 5, time: "01:15 PM", subject: "EP", type: "Lecture", room: "B-22", status: "Upcoming", teacher: "Prof. YSP" },
        { id: 6, time: "02:15 PM", subject: "Data Structures (DS)", type: "Lecture", room: "B-22", status: "Upcoming", teacher: "Prof. SB" },
        { id: 7, time: "03:15 PM", subject: "IKS", type: "Lecture", room: "B-22", status: "Upcoming", teacher: "Prof. SSP" },
    ];

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Today&apos;s Schedule</h1>
                    <p className="text-neutral-500">Thursday, 25 Oct</p>
                </div>
            </div>

            <div className="relative pl-6 border-l border-neutral-200 dark:border-neutral-800 space-y-8">
                {schedule.map((slot) => {
                    const isUpcoming = slot.status === 'Upcoming';
                    const isCancelled = slot.status === 'Cancelled';

                    return (
                        <div key={slot.id} className="relative">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[29px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-neutral-950 ${isCancelled ? 'bg-red-400' :
                                isUpcoming ? 'bg-neutral-300 dark:bg-neutral-700' : 'bg-green-500'
                                }`} />

                            <div className={`p-4 rounded-xl border transition-all ${isUpcoming
                                ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                                : isCancelled
                                    ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 opacity-70'
                                    : 'bg-neutral-50 dark:bg-neutral-800/50 border-transparent'
                                }`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className={`font-semibold text-lg ${isCancelled ? 'line-through text-neutral-500' : 'text-neutral-900 dark:text-neutral-100'}`}>
                                            {slot.subject}
                                        </h3>
                                        <p className="text-sm text-neutral-500">{slot.teacher}</p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-sm font-medium font-mono text-neutral-600 dark:text-neutral-400">{slot.time}</span>
                                        {isCancelled && <Badge variant="destructive" className="h-5 text-[10px]">Cancelled</Badge>}
                                        {slot.type === 'Lab' && !isCancelled && <Badge variant="secondary" className="h-5 text-[10px]">Lab</Badge>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-neutral-400 font-medium uppercase tracking-wide">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={12} />
                                        {slot.room}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={12} />
                                        1h 00m
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

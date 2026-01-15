"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Clock, Users, Plus, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";

export default function SharedSessionsPage() {
    const sharedSessions = [
        {
            id: 201,
            subject: "AM-II",
            sharer: "Prof. Verma",
            time: "Oct 24 • 11:30 AM",
            status: "In Progress",
            studentsMarked: 12,
            totalStudents: 58
        },
        {
            id: 202,
            subject: "Data Structures (DS)",
            sharer: "Prof. Gupta",
            time: "Oct 23 • 02:00 PM",
            status: "Review Pending",
            studentsMarked: 30,
            totalStudents: 30
        }
    ];

    const [open, setOpen] = useState(false);

    const handleAssign = () => {
        setOpen(false);
        toast.success("Class assigned successfully", {
            description: "Notification sent to designated faculty."
        });
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Shared with You</h1>
                    <p className="text-neutral-500">Collaborate on sessions initiated by colleagues</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus size={16} className="mr-2" /> Assign Class
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Assign Class to Faculty</DialogTitle>
                            <DialogDescription>
                                Request another faculty member to conduct your session.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Select Faculty</Label>
                                <Input placeholder="Search faculty name..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Subject / Batch</Label>
                                <Input placeholder="e.g. Data Structures (B2)" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Time</Label>
                                    <Input type="time" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Note</Label>
                                <Input placeholder="Instructions (optional)" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button className="w-full" onClick={handleAssign}>
                                <Send size={16} className="mr-2" /> Send Request
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sharedSessions.map((session) => (
                    <Link href={`/teacher/attendance/${session.id}`} key={session.id}>
                        <Card className="p-5 border-neutral-200 dark:border-neutral-800 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{session.subject}</h3>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <Avatar className="w-5 h-5">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${session.sharer}`} />
                                            <AvatarFallback>{session.sharer[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-neutral-500">by {session.sharer}</span>
                                    </div>
                                </div>
                                {session.status === 'In Progress' && (
                                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/50">
                                        Live
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-4 text-xs font-medium text-neutral-400 mt-4">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} />
                                    {session.time}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Users size={14} />
                                    {session.studentsMarked} / {session.totalStudents}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Continue Marking <ArrowRight size={16} className="ml-2" />
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}


import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Trash2, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

interface SlotDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (slotId: string, updates: any) => Promise<void>;
    onDelete: (slotId: string) => Promise<void>;
    slot: any; // Using any for flexibility with the slot object structure
}

export function SlotDetailsDialog({
    isOpen,
    onClose,
    onUpdate,
    onDelete,
    slot,
}: SlotDetailsDialogProps) {
    const [room, setRoom] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (slot) {
            setRoom(slot.room || "");
            // Format time to HH:MM for input[type="time"]
            // Assuming slot.start_time is "HH:MM:SS" or similar
            setStartTime(slot.start_time?.slice(0, 5) || "");
            setEndTime(slot.end_time?.slice(0, 5) || "");
        }
    }, [slot]);

    const handleSave = async () => {
        if (!startTime || !endTime) {
            toast.error("Start and end time are required");
            return;
        }

        setSaving(true);
        try {
            await onUpdate(slot.id, {
                room,
                start_time: startTime,
                end_time: endTime,
            });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update slot");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this class?")) return;

        setDeleting(true);
        try {
            await onDelete(slot.id);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete slot");
        } finally {
            setDeleting(false);
        }
    };

    if (!slot) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Class Details</DialogTitle>
                    <DialogDescription>
                        {slot.subjects?.name} ({slot.subjects?.code})
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="room" className="text-right">
                            Room
                        </Label>
                        <div className="col-span-3">
                            <div className="relative">
                                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                                <Input
                                    id="room"
                                    value={room}
                                    onChange={(e) => setRoom(e.target.value)}
                                    className="pl-9"
                                    placeholder="e.g. 101"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="start" className="text-right">
                            Start
                        </Label>
                        <div className="col-span-3">
                            <div className="relative">
                                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                                <Input
                                    id="start"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="end" className="text-right">
                            End
                        </Label>
                        <div className="col-span-3">
                            <div className="relative">
                                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                                <Input
                                    id="end"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={handleDelete}
                        disabled={deleting || saving}
                    >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={saving || deleting}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleSave} disabled={saving || deleting}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}

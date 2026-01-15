"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";

interface QuickActionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    actionLabel: string;
    href: string;
    gradient: string;
}

export default function QuickActionCard({ title, description, icon: Icon, actionLabel, href, gradient }: QuickActionCardProps) {
    return (
        <div className={`rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-between h-[200px] ${gradient}`}>
            <div className="absolute top-0 right-0 p-6 opacity-20">
                <Icon size={80} />
            </div>

            <div className="relative z-10 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-2">
                    <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                <p className="text-sm text-white/80 font-medium max-w-[80%]">{description}</p>
            </div>

            <Link href={href} className="relative z-10">
                <Button variant="secondary" size="sm" className="w-full bg-white/10 hover:bg-white/20 border-0 text-white backdrop-blur-md justify-between group">
                    {actionLabel}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
        </div>
    );
}

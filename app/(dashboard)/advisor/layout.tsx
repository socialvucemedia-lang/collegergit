"use client";

import { FileBarChart, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdvisorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { href: '/advisor', label: 'Overview', icon: FileBarChart },
        { href: '/advisor/students', label: 'Students', icon: Users },
        { href: '/advisor/risks', label: 'At Risk', icon: AlertTriangle },
    ];

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pb-20">
            <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-6 h-16 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-md">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">Advisor Console</span>
                </div>
                <div className="text-xs text-neutral-500 font-medium px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                    Class of 2026
                </div>
            </header>

            <main className="p-6 max-w-2xl mx-auto">
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 z-50">
                <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive
                                    ? 'text-primary'
                                    : 'text-neutral-400 hover:text-neutral-600'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    );
}

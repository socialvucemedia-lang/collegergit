"use client";

import { GraduationCap, Users, ClipboardList, Menu, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        router.push('/login');
    };

    const navItems = [
        { href: '/teacher', label: 'Classes', icon: GraduationCap },
        { href: '/teacher/shared', label: 'Shared', icon: Users },
        { href: '/teacher/reports', label: 'Reports', icon: ClipboardList },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 pb-20">
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-800 z-50 px-4 md:px-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-lg tracking-tight text-neutral-900 dark:text-neutral-100 italic">Test Mode with Section B Data</span>
                    <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-2 hidden md:block" />
                    <span className="font-medium text-neutral-500 hidden md:block">Faculty Portal</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    </Button>
                    <div className="hidden md:flex items-center gap-6 mr-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`text-sm font-medium transition-colors ${pathname === item.href
                                    ? 'text-neutral-900 dark:text-neutral-100'
                                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
                {children}
            </main>

            {/* Bottom Navigation (Mobile Only) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 pb-safe z-50 md:hidden">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive
                                    ? 'text-neutral-900 dark:text-neutral-100'
                                    : 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400'
                                    }`}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    );
}

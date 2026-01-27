"use client";

import { LayoutDashboard, Users, AlertTriangle, Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdvisorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
    };

    const navItems = [
        { href: '/advisor', label: 'Overview', icon: LayoutDashboard },
        { href: '/advisor/students', label: 'Students', icon: Users },
        { href: '/advisor/risks', label: 'At Risk', icon: AlertTriangle },
    ];

    return (
        <ProtectedRoute requiredRole="advisor">
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-24">
                {/* Top Bar - Minimal Mobile-First */}
                <header className="fixed top-0 left-0 right-0 h-14 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-md z-40 px-4 flex items-center justify-between">
                    <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">Advisor Console</span>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
                            <Bell size={20} />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                <main className="pt-20 px-4 max-w-lg mx-auto">
                    {children}
                </main>

                {/* Floating Bottom Nav (Premium Dark Pill) */}
                <nav className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto bg-neutral-900 dark:bg-neutral-800 text-white rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-neutral-900/50 z-50">
                    <div className="flex justify-around items-center h-16 px-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative flex flex-col items-center justify-center flex-1 h-full"
                                >
                                    <div className={`transition-all duration-200 ${isActive ? 'opacity-100 scale-100' : 'opacity-50 scale-90'
                                        }`}>
                                        <item.icon size={22} strokeWidth={2.5} />
                                    </div>
                                    {isActive && (
                                        <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            </div>
        </ProtectedRoute>
    );
}

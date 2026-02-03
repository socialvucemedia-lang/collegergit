'use client';

import { LayoutDashboard, UserCog, Building2, LogOut, Book, GraduationCap, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function AdminNav() {
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <>
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex w-64 flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 h-screen sticky top-0">
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <span className="font-bold text-lg">Admin Control</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        <LayoutDashboard size={18} />
                        Dashboard
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors">
                        <UserCog size={18} />
                        Users & Roles
                    </Link>
                    <Link href="/admin/departments" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors">
                        <Building2 size={18} />
                        Departments
                    </Link>
                    <Link href="/admin/subjects" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors">
                        <Book size={18} />
                        Subjects
                    </Link>
                    <Link href="/admin/students" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors">
                        <GraduationCap size={18} />
                        Students
                    </Link>
                    <Link href="/admin/allocation" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors">
                        <Users size={18} />
                        Faculty Allocation
                    </Link>
                    <Link href="/admin/timetable" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors">
                        <Calendar size={18} />
                        Timetable
                    </Link>
                </nav>
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden h-14 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-4 sticky top-0 z-50">
                <span className="font-bold">Admin Control</span>
            </div>
        </>
    );
}

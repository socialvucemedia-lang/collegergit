"use client";

import { LayoutDashboard, UserCog, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col md:flex-row">
            {/* Sidebar for Desktop / Hidden on Mobile for now (Mobile simplified) */}
            <aside className="hidden md:flex w-64 flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 h-screen sticky top-0">
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <span className="font-bold text-lg">Admin Control</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                        <LayoutDashboard size={18} />
                        Dashboard
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900 transition-colors">
                        <UserCog size={18} />
                        User Management
                    </Link>
                    <Link href="/admin/depts" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900 transition-colors">
                        <Building2 size={18} />
                        Departments
                    </Link>
                </nav>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden h-14 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-4 sticky top-0 z-50">
                <span className="font-bold">Admin Control</span>
            </div>

            <main className="flex-1 p-6 md:p-8">
                {children}
            </main>
        </div>
    );
}

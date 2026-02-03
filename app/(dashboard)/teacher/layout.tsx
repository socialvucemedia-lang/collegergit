import { verifyServerAuth } from '@/lib/server-auth';
import { TeacherNav } from '@/components/teacher/TeacherNav';

export default async function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side auth check - redirects if not authenticated or wrong role
    await verifyServerAuth('teacher');

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            <TeacherNav />
            <main className="pt-20 px-4 max-w-lg mx-auto pb-24">
                {children}
            </main>
        </div>
    );
}

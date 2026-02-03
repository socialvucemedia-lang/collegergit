import { verifyServerAuth } from '@/lib/server-auth';
import { StudentNav } from '@/components/student/StudentNav';

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side auth check - redirects if not authenticated or wrong role
    await verifyServerAuth('student');

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-24">
            <StudentNav />
            <main className="pt-20 px-4 max-w-lg mx-auto">
                {children}
            </main>
        </div>
    );
}

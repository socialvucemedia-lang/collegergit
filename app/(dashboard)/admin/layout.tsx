import { verifyServerAuth } from '@/lib/server-auth';
import { AdminNav } from '@/components/admin/AdminNav';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await verifyServerAuth('admin');

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col md:flex-row">
            <AdminNav />
            <main className="flex-1 p-6 md:p-8">
                {children}
            </main>
        </div>
    );
}

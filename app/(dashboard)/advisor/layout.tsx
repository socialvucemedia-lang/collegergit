import { verifyServerAuth } from '@/lib/server-auth';
import { AdvisorNav } from '@/components/advisor/AdvisorNav';

export default async function AdvisorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await verifyServerAuth('advisor');

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-24">
            <AdvisorNav />
            <main className="pt-20 px-4 max-w-lg mx-auto">
                {children}
            </main>
        </div>
    );
}

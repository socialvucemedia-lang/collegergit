export default function AdvisorDashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Class Health</h1>
                <p className="text-neutral-500">Computer Engineering • Sem 4</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <p className="text-sm font-medium text-neutral-500 uppercase">Avg. Attendance</p>
                    <p className="text-3xl font-bold mt-2 text-neutral-900 dark:text-neutral-50">84.2%</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <p className="text-sm font-medium text-neutral-500 uppercase">Below 75%</p>
                    <p className="text-3xl font-bold mt-2 text-red-600">8</p>
                    <p className="text-xs text-neutral-400 mt-1">Students Critical</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <p className="text-sm font-medium text-neutral-500 uppercase">Today&apos;s Presence</p>
                    <p className="text-3xl font-bold mt-2 text-green-600">92%</p>
                </div>
            </div>
        </div>
    );
}

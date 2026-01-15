import AttendanceSession from '@/components/attendance/AttendanceSession';

interface PageProps {
    params: Promise<{ sessionId: string }>;
}

export default function AttendancePage({ params }: PageProps) {
    const _params = params; // Silence unused warning
    console.log(_params);
    return <AttendanceSession sessionId={"101"} />; // Pass dummy for now or actually await it properly if used
}

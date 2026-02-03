import { createServerClient } from '@/lib/supabase-server';
import { verifyServerAuth } from '@/lib/server-auth';
import { StudentDashboardClient } from '@/components/student/StudentDashboardClient';

async function getStudentData(userId: string) {
    const supabase = await createServerClient();

    // Get student profile
    const { data: student } = await supabase
        .from('students')
        .select('id, semester, division, batch')
        .eq('user_id', userId)
        .single();

    if (!student) {
        return { timeline: [], dayInfo: null, attendance: null };
    }

    // Get today's timeline
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const dayName = days[today.getDay()];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    // Fetch timetable for today
    const { data: timetable } = await supabase
        .from('timetable_entries')
        .select(`
            id,
            start_time,
            end_time,
            room,
            allocations!inner(
                id,
                division,
                semester,
                subjects(id, code, name),
                users(full_name)
            )
        `)
        .eq('day_of_week', dayName)
        .eq('allocations.semester', student.semester)
        .eq('allocations.division', student.division)
        .order('start_time');

    // Transform to timeline format with status
    const timeline = (timetable || []).map((entry: any) => {
        let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
        if (entry.end_time <= currentTime) status = 'completed';
        else if (entry.start_time <= currentTime && entry.end_time > currentTime) status = 'current';

        return {
            id: entry.id,
            subject_code: entry.allocations?.subjects?.code || '',
            subject_name: entry.allocations?.subjects?.name || '',
            start_time: entry.start_time,
            end_time: entry.end_time,
            room: entry.room || '',
            teacher_name: entry.allocations?.users?.full_name || '',
            status,
            attendance_status: null, // Would need to fetch from attendance_records
        };
    });

    // Fetch attendance summary
    const { data: attendanceRecords } = await supabase
        .from('attendance_records')
        .select(`
            status,
            attendance_sessions!inner(
                subject_id,
                subjects(id, code, name)
            )
        `)
        .eq('student_id', student.id);

    // Calculate attendance stats
    let attendance = null;
    if (attendanceRecords && attendanceRecords.length > 0) {
        const subjectMap = new Map<string, { total: number; present: number; subject: any }>();

        for (const record of attendanceRecords) {
            const subject = (record.attendance_sessions as any)?.subjects;
            if (!subject) continue;

            const existing = subjectMap.get(subject.id) || { total: 0, present: 0, subject };
            existing.total++;
            if (record.status === 'present' || record.status === 'late') {
                existing.present++;
            }
            subjectMap.set(subject.id, existing);
        }

        const subjects = Array.from(subjectMap.entries()).map(([id, data]) => ({
            subject_id: id,
            subject_code: data.subject.code,
            subject_name: data.subject.name,
            total: data.total,
            present: data.present,
            percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        }));

        const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0);
        const totalAttended = subjects.reduce((sum, s) => sum + s.present, 0);

        attendance = {
            overall: {
                total_classes: totalClasses,
                attended: totalAttended,
                percentage: totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0,
            },
            subjects,
        };
    }

    return {
        timeline,
        dayInfo: { date: today.toISOString(), day_name: dayName },
        attendance,
    };
}

export default async function StudentDashboard() {
    const { user } = await verifyServerAuth('student');
    const data = await getStudentData(user.id);

    return (
        <StudentDashboardClient
            timeline={data.timeline}
            dayInfo={data.dayInfo}
            attendance={data.attendance}
        />
    );
}

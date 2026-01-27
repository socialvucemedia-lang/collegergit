import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get student profile
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('id, roll_number, semester, department_id')
            .eq('user_id', user.id)
            .single();

        if (studentError || !student) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 403 });
        }

        // Get all attendance records for this student
        const { data: records, error: recordsError } = await supabase
            .from('attendance_records')
            .select(`
        id,
        status,
        marked_at,
        attendance_sessions (
          id,
          session_date,
          subjects (
            id,
            code,
            name,
            semester
          )
        )
      `)
            .eq('student_id', student.id);

        if (recordsError) {
            return NextResponse.json({ error: recordsError.message }, { status: 500 });
        }

        // Group by subject and calculate percentages
        const subjectStats: Record<string, {
            subject_id: string;
            subject_code: string;
            subject_name: string;
            semester: number | null;
            total: number;
            present: number;
            absent: number;
            late: number;
            percentage: number;
        }> = {};

        records?.forEach((record: any) => {
            const session = record.attendance_sessions;
            const subject = session?.subjects;
            if (!subject) return;

            if (!subjectStats[subject.id]) {
                subjectStats[subject.id] = {
                    subject_id: subject.id,
                    subject_code: subject.code,
                    subject_name: subject.name,
                    semester: subject.semester,
                    total: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    percentage: 0,
                };
            }

            subjectStats[subject.id].total++;
            if (record.status === 'present') subjectStats[subject.id].present++;
            else if (record.status === 'absent') subjectStats[subject.id].absent++;
            else if (record.status === 'late') subjectStats[subject.id].late++;
        });

        // Calculate percentages
        Object.values(subjectStats).forEach((stat) => {
            stat.percentage = stat.total > 0
                ? Math.round(((stat.present + stat.late) / stat.total) * 100)
                : 0;
        });

        // Overall stats
        const totalClasses = records?.length || 0;
        const totalPresent = records?.filter((r: any) => r.status === 'present' || r.status === 'late').length || 0;
        const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

        return NextResponse.json({
            student: {
                id: student.id,
                roll_number: student.roll_number,
                semester: student.semester,
            },
            overall: {
                total_classes: totalClasses,
                attended: totalPresent,
                percentage: overallPercentage,
            },
            subjects: Object.values(subjectStats),
        });
    } catch (error) {
        console.error('Student attendance fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

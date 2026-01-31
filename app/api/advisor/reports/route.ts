import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') || 'full'; // full, batch, defaulter
        const batch = searchParams.get('batch');

        // Authn check
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get advisor details
        const { data: advisor } = await supabase
            .from('class_advisors')
            .select('semester, section, department_id')
            .eq('user_id', user.id)
            .single();

        let semester: number, section: string | null = null, department_id: string | null = null;

        if (advisor) {
            semester = advisor.semester;
            section = advisor.section;
            department_id = advisor.department_id;
        } else {
            // Fallback for teachers viewing report (if allowed)
            const { data: teacher } = await supabase
                .from('teachers')
                .select('department_id')
                .eq('user_id', user.id)
                .single();
            if (!teacher) return NextResponse.json({ error: 'Access restricted to Class Advisors' }, { status: 403 });
            return NextResponse.json({ error: 'Access restricted to Class Advisors' }, { status: 403 });
        }

        // 1. Fetch Students with User Full Name
        // Correctly joining the users table to get the name
        let query = supabase
            .from('students')
            .select(`
                id,
                roll_number,
                batch,
                users (
                    full_name
                )
            `)
            .eq('semester', semester)
            .order('roll_number', { ascending: true });

        if (section) query = query.eq('section', section);
        if (department_id) query = query.eq('department_id', department_id);
        if (type === 'batch' && batch) query = query.eq('batch', batch);

        const { data: students, error: studentError } = await query;
        if (studentError || !students || students.length === 0) {
            return NextResponse.json({ error: 'No students found' }, { status: 404 });
        }

        // 2. Fetch Subjects for columns
        let subjectQuery = supabase
            .from('subjects')
            .select('id, code, name')
            .eq('semester', semester);

        if (department_id) {
            subjectQuery = subjectQuery.eq('department_id', department_id);
        }

        const { data: subjects } = await subjectQuery;

        const subjectList = subjects || [];

        // 3. Fetch ALL Attendance for these students
        const studentIds = students.map(s => s.id);

        const { data: attendanceData, error: attError } = await supabase
            .from('attendance_records')
            .select(`
                student_id,
                status,
                session:attendance_sessions!inner (
                    subject_id
                )
            `)
            .in('student_id', studentIds);

        if (attError) {
            return NextResponse.json({ error: attError.message }, { status: 500 });
        }

        // 4. Aggregate Data in Memory
        const stats = new Map<string, {
            totalPresent: number,
            totalLectures: number,
            subjectStats: Map<string, { present: number, total: number }>
        }>();

        // Init
        students.forEach(s => {
            stats.set(s.id, {
                totalPresent: 0,
                totalLectures: 0,
                subjectStats: new Map()
            });
            subjectList.forEach(sub => {
                stats.get(s.id)!.subjectStats.set(sub.id, { present: 0, total: 0 });
            });
        });

        // Fill
        attendanceData?.forEach((record: any) => {
            const studentStat = stats.get(record.student_id);
            if (!studentStat) return;

            const subjectId = record.session?.subject_id;
            const isPresent = record.status === 'present' || record.status === 'late';

            // Global
            studentStat.totalLectures++;
            if (isPresent) studentStat.totalPresent++;

            // Subject-wise
            const subStat = studentStat.subjectStats.get(subjectId);
            if (subStat) {
                subStat.total++;
                if (isPresent) subStat.present++;
            }
        });

        // 5. Generate CSV Rows
        // Format: Roll, Name, [Sub1 Count], [Sub1 %], ..., [Total Count], [Total %]
        // Count format is "Attended/Total" to require fewer columns
        const header = ['Roll No', 'Name'];
        subjectList.forEach(s => {
            header.push(`${s.code} (Att/Tot)`);
            header.push(`${s.code} %`);
        });
        header.push('Total (Att/Tot)');
        header.push('Total %');

        const rows: string[] = [header.join(',')];

        for (const student of students) {
            const data = stats.get(student.id)!;

            // Calculate Global %
            const globalPct = data.totalLectures > 0
                ? Math.round((data.totalPresent / data.totalLectures) * 100)
                : 0;

            if (type === 'defaulter' && globalPct >= 75) {
                continue;
            }

            // Access nested user data safely
            const fullName = (student as any).users?.full_name || 'Unknown';

            const row = [
                student.roll_number || 'N/A',
                `"${fullName}"`,
            ];

            // Subject percentages
            subjectList.forEach(sub => {
                const subStat = data.subjectStats.get(sub.id)!;
                const subPct = subStat.total > 0
                    ? Math.round((subStat.present / subStat.total) * 100)
                    : 0;

                row.push(`"${subStat.present}/${subStat.total}"`);
                row.push(`${subPct}%`);
            });

            row.push(`"${data.totalPresent}/${data.totalLectures}"`);
            row.push(`${globalPct}%`);
            rows.push(row.join(','));
        }

        // Return CSV
        const csvContent = rows.join('\n');

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="report_${type}_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error('Report generation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

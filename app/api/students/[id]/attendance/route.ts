import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get('subject_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        session:attendance_sessions!inner(
          *,
          subject:subjects(*)
        )
      `)
      .eq('student_id', id);

    if (subjectId) {
      query = query.eq('session.subject_id', subjectId);
    }

    if (startDate) {
      query = query.gte('session.session_date', startDate);
    }

    if (endDate) {
      query = query.lte('session.session_date', endDate);
    }

    query = query.order('session.session_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Calculate attendance statistics
    const totalSessions = data?.length || 0;
    const presentCount = data?.filter(r => r.status === 'present').length || 0;
    const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

    return NextResponse.json({
      records: data || [],
      statistics: {
        total_sessions: totalSessions,
        present_count: presentCount,
        absent_count: totalSessions - presentCount,
        attendance_rate: Math.round(attendanceRate * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Student attendance fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

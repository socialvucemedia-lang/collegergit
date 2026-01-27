import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { AttendanceStatus } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');
    const studentId = searchParams.get('student_id');

    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        session:attendance_sessions(*),
        student:students(*, user:users(*))
      `)
      .order('marked_at', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ records: data || [] });
  } catch (error) {
    console.error('Records fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, student_id, status, notes } = body;

    if (!session_id || !student_id || !status) {
      return NextResponse.json(
        { error: 'session_id, student_id, and status are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Use upsert to handle duplicate entries
    const { data, error } = await supabase
      .from('attendance_records')
      .upsert({
        session_id,
        student_id,
        status: status as AttendanceStatus,
        notes: notes || null,
      }, {
        onConflict: 'session_id,student_id',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ record: data }, { status: 201 });
  } catch (error) {
    console.error('Record creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bulk create/update attendance records
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, records } = body; // records: [{ student_id, status, notes? }]

    if (!session_id || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'session_id and records array are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Prepare records for upsert
    const upsertData = records.map((record: { student_id: string; status: AttendanceStatus; notes?: string }) => ({
      session_id,
      student_id: record.student_id,
      status: record.status,
      notes: record.notes || null,
    }));

    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(upsertData, {
        onConflict: 'session_id,student_id',
      })
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ records: data || [] });
  } catch (error) {
    console.error('Bulk records update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const searchParams = request.nextUrl.searchParams;
        const academic_year = searchParams.get('academic_year');
        const teacher_id = searchParams.get('teacher_id');

        let query = supabase
            .from('teacher_subject_allocations')
            .select(`
        *,
        teachers (
          id,
          employee_id,
          users (
            full_name,
            email
          )
        ),
        subjects (
          id,
          code,
          name,
          semester,
          departments (
            code,
            name
          )
        )
      `)
            .order('created_at', { ascending: false });

        if (academic_year) {
            query = query.eq('academic_year', academic_year);
        }

        if (teacher_id) {
            query = query.eq('teacher_id', teacher_id);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ allocations: data || [] });
    } catch (error) {
        console.error('Allocations fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const body = await request.json();
        const { teacher_id, subject_id, section, batch, academic_year } = body;

        if (!teacher_id || !subject_id || !academic_year || !section) {
            return NextResponse.json(
                { error: 'Teacher, Subject, Section, and Academic Year are required' },
                { status: 400 }
            );
        }

        // Check for duplicate allocation
        const { data: existing } = await supabase
            .from('teacher_subject_allocations')
            .select('id')
            .eq('teacher_id', teacher_id)
            .eq('subject_id', subject_id)
            .eq('academic_year', academic_year)
            .eq('section', section)
            .eq('batch', batch || '')
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: 'This allocation already exists' },
                { status: 409 }
            );
        }

        const { data, error } = await supabase
            .from('teacher_subject_allocations')
            .insert({
                teacher_id,
                subject_id,
                section,
                batch: batch || null,
                academic_year,
            })
            .select(`
        *,
        teachers (
          id,
          employee_id,
          users (
            full_name
          )
        ),
        subjects (
          id,
          code,
          name
        )
      `)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ allocation: data });
    } catch (error) {
        console.error('Allocation creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

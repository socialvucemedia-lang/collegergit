import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const department_id = searchParams.get('department_id');
    const semester = searchParams.get('semester');

    let query = supabase
      .from('subjects')
      .select(`
        *,
        departments (
          id,
          code,
          name
        )
      `)
      .order('code', { ascending: true });

    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    if (semester) {
      query = query.eq('semester', parseInt(semester));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subjects: data || [] });
  } catch (error) {
    console.error('Subjects fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { code, name, department_id, semester, credits } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Subject code and name are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert({
        code,
        name,
        department_id: department_id || null,
        semester: semester ? parseInt(semester) : null,
        credits: credits ? parseInt(credits) : null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Subject with this code already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subject: data });
  } catch (error) {
    console.error('Subject creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

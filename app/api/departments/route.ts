import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/api-auth';

export async function GET() {
  try {
    const auth = await getAuthorizedUser();
    if (auth.error) return auth.error;

    // Standard client is fine for departments as they are usually public or standard RLS
    // but we use the helper to ensure session is valid
    const { supabase } = auth;

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ departments: data || [] });
  } catch (error) {
    console.error('Departments fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthorizedUser();
    if (auth.error) return auth.error;

    // Only admin can create departments
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { supabaseAdmin } = auth;
    const body = await request.json();
    const { name, code } = body;

    const { data, error } = await supabaseAdmin
      .from('departments')
      .insert({ name, code })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Department with this code already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ department: data });
  } catch (error) {
    console.error('Department creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // Fetch all teachers with their user details
        const { data, error } = await supabase
            .from('teachers')
            .select(`
        id,
        employee_id,
        department_id,
        users (
          id,
          full_name,
          email
        )
      `)
            .order('employee_id', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ teachers: data || [] });
    } catch (error) {
        console.error('Teachers fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

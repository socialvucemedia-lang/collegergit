import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        const { isAdmin, isAdvisor, supabase, supabaseAdmin } = auth;
        const isAuthorized = isAdmin || isAdvisor;
        const client = isAuthorized ? supabaseAdmin : supabase;

        // Fetch all teachers with their user details
        const { data, error } = await client
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

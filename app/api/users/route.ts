import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthorizedUser();
    if (auth.error) return auth.error;

    const { isAdmin, supabase, supabaseAdmin } = auth;
    const searchParams = request.nextUrl.searchParams;
    const roleReq = searchParams.get('role');

    // Use supabaseAdmin for admins to bypass RLS, otherwise use standard client
    const client = isAdmin ? supabaseAdmin : supabase;

    let query = client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (roleReq) {
      query = query.eq('role', roleReq);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: data || [] });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

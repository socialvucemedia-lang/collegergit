import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createServerClient();

        const { data, error } = await supabase
            .from('subjects')
            .select(`
        *,
        departments (
          id,
          code,
          name
        )
      `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        return NextResponse.json({ subject: data });
    } catch (error) {
        console.error('Subject fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createServerClient();
        const body = await request.json();
        const { code, name, department_id, semester, credits } = body;

        const updateData: any = {};
        if (code !== undefined) updateData.code = code;
        if (name !== undefined) updateData.name = name;
        if (department_id !== undefined) updateData.department_id = department_id;
        if (semester !== undefined) updateData.semester = semester ? parseInt(semester) : null;
        if (credits !== undefined) updateData.credits = credits ? parseInt(credits) : null;

        const { data, error } = await supabase
            .from('subjects')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ subject: data });
    } catch (error) {
        console.error('Subject update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createServerClient();

        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Subject delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

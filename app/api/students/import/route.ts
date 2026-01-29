import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const text = await file.text();
        const lines = text.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
            return NextResponse.json({ error: 'CSV must have header and at least one data row' }, { status: 400 });
        }

        // Parse header
        const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const requiredFields = ['email', 'full_name', 'roll_number'];
        const missingFields = requiredFields.filter((f) => !header.includes(f));

        if (missingFields.length > 0) {
            return NextResponse.json(
                { error: `Missing required columns: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        // Get department mapping
        const { data: departments } = await supabase.from('departments').select('id, code');
        const deptMap = new Map(departments?.map((d) => [d.code.toLowerCase(), d.id]) || []);

        const results = { created: 0, errors: [] as string[] };

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v) => v.trim());
            const row: Record<string, string> = {};
            header.forEach((h, idx) => {
                row[h] = values[idx] || '';
            });

            if (!row.email || !row.full_name || !row.roll_number) {
                results.errors.push(`Row ${i + 1}: Missing required fields`);
                continue;
            }

            const password = row.password || row.roll_number; // Default password = roll number

            try {
                // Create auth user
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: row.email,
                    password,
                    email_confirm: true,
                    user_metadata: { full_name: row.full_name, role: 'student' }
                });

                if (authError) {
                    results.errors.push(`Row ${i + 1}: ${authError.message}`);
                    continue;
                }

                // Create user profile
                await supabase.from('users').insert({
                    id: authData.user.id,
                    email: row.email,
                    full_name: row.full_name,
                    role: 'student',
                });

                // Create student record
                const semester = row.semester ? parseInt(row.semester) : 1;
                const department_id = row.department ? deptMap.get(row.department.toLowerCase()) : null;
                const section = row.section || null;
                const batch = row.batch || null;

                await supabase.from('students').insert({
                    user_id: authData.user.id,
                    roll_number: row.roll_number,
                    semester,
                    department_id,
                    section,
                    batch,
                });

                results.created++;
            } catch (err: any) {
                results.errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            created: results.created,
            errors: results.errors.length > 0 ? results.errors : undefined,
        });
    } catch (error) {
        console.error('Student import error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

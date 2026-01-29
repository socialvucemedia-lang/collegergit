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
        const requiredFields = ['code', 'name'];
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

        // Parse rows
        const subjects: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v) => v.trim());
            const row: Record<string, string> = {};
            header.forEach((h, idx) => {
                row[h] = values[idx] || '';
            });

            if (!row.code || !row.name) {
                errors.push(`Row ${i + 1}: Missing code or name`);
                continue;
            }

            const subject: any = {
                code: row.code,
                name: row.name,
                semester: row.semester ? parseInt(row.semester) : null,
                credits: row.credits ? parseInt(row.credits) : null,
                department_id: null,
            };

            // Map department code to ID
            if (row.department) {
                const deptId = deptMap.get(row.department.toLowerCase());
                if (deptId) {
                    subject.department_id = deptId;
                } else {
                    errors.push(`Row ${i + 1}: Unknown department "${row.department}"`);
                }
            }

            subjects.push(subject);
        }

        if (subjects.length === 0) {
            return NextResponse.json({ error: 'No valid subjects to import', details: errors }, { status: 400 });
        }

        // Bulk insert with upsert on code
        const { data, error } = await supabase
            .from('subjects')
            .upsert(subjects, { onConflict: 'code' })
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            imported: data?.length || 0,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('CSV import error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

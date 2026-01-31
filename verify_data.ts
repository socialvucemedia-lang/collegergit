
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manually load .env.local
const envPath = path.join(process.cwd(), '.env.local');
let env: Record<string, string> = {};

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
} catch (e) {
    console.error("Could not read .env.local");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using service role if available for unrestricted access, otherwise anon might fail if RLS is strict
// But we'll try anon first, assuming we are debugging in dev environment where we might have access or need service key.
// Actually, for a script, we often need SERVICE_ROLE_KEY to bypass RLS if we aren't signed in.
// Let's see if we can find the service key in env, otherwise we might be limited.
// If this fails, we'll ask user or try to query public data?
// Usually local dev has a permissive policy or we can just try.
// Given the previous files, let's try to just use what we have.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const SESSION_ID = '55b52aee-644f-430f-9c12-6fffbd6eb939';

    console.log(`Checking Session: ${SESSION_ID}`);

    // 1. Get Session
    const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select(`
      *,
      subjects (
        id,
        name,
        code,
        semester,
        department_id
      )
    `)
        .eq('id', SESSION_ID)
        .single();

    if (sessionError) {
        console.error('Session Error:', sessionError);
        return;
    }

    console.log('Session Data:', {
        id: session.id,
        batch: session.batch,
        section: session.section,
        subject_semester: session.subjects?.semester,
        subject_dept: session.subjects?.department_id
    });

    const subject = session.subjects;
    if (!subject) {
        console.error('No subject found for session');
        return;
    }

    // 2. Check Students in that Department
    console.log(`\nChecking Students in Dept: ${subject.department_id}`);

    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, roll_number, semester, section, batch, department_id')
        .eq('department_id', subject.department_id)
        .limit(10); // Check first 10

    if (studentsError) {
        console.error('Students Error:', studentsError);
        return;
    }

    console.log(`Found ${students?.length} students in department.`);
    if (students && students.length > 0) {
        console.log('Sample Student Data (first 5):');
        students.slice(0, 5).forEach(s => {
            console.log({
                id: s.id,
                semester: s.semester,
                section: s.section,
                batch: s.batch,
                roll: s.roll_number
            });
        });

        // specific check for Strategy 2 (Dept + Sem) failure
        if (session.subjects?.semester) {
            const matchingSem = students.filter(s => s.semester === session.subjects.semester);
            console.log(`\nStudents matching Semester ${session.subjects.semester}: ${matchingSem.length}`);
        } else {
            console.log('\nSubject has NO semester defined!');
        }

        // specific check for Strategy 1 (Strict) failure
        if (session.subjects?.semester) {
            let strictMatches = students.filter(s => s.semester === session.subjects.semester);
            if (session.section) strictMatches = strictMatches.filter(s => s.section === session.section);
            if (session.batch) strictMatches = strictMatches.filter(s => s.batch === session.batch);

            console.log(`Students matching STRICT (Sem + Section + Batch): ${strictMatches.length}`);
        }
    }
}

main();

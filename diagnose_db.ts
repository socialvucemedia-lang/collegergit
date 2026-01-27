
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manually load .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- Database Diagnostics ---');

    // Check Students
    const { data: students, count: studentCount } = await supabase
        .from('students')
        .select('id, roll_number, section, batch, semester', { count: 'exact' });

    console.log(`Total Students: ${studentCount}`);
    if (students && students.length > 0) {
        console.log('Sample Students:', students.slice(0, 5));
        const sections = [...new Set(students.map(s => s.section))];
        const batches = [...new Set(students.map(s => s.batch))];
        const semesters = [...new Set(students.map(s => s.semester))];
        console.log('Available Sections:', sections);
        console.log('Available Batches:', batches);
        console.log('Available Semesters:', semesters);
    } else {
        console.log('No students found!');
    }

    // Check Sessions
    const { data: sessions, count: sessionCount } = await supabase
        .from('attendance_sessions')
        .select('id, section, batch, subject_id', { count: 'exact', head: false })
        .limit(5);

    console.log(`\nTotal Sessions: ${sessionCount}`);
    if (sessions && sessions.length > 0) {
        console.log('Sample Sessions:', sessions);
    }

    // Check Subjects
    const { data: subjects } = await supabase
        .from('subjects')
        .select('id, code, name, semester, department_id')
        .limit(5);
    console.log(`\nSample Subjects:`, subjects);
}

diagnose();

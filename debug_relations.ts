
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
    console.log('--- Deep Dive Diagnostics ---');

    // 1. Find the Subject "Semiconductor Physics" or code "BSC202X"
    const { data: subjects, error: subjError } = await supabase
        .from('subjects')
        .select('*')
        .or('name.ilike.%Physics%,code.eq.BSC202X');

    if (subjError) console.error(subjError);

    if (!subjects || subjects.length === 0) {
        console.log("Could not find subject 'Semiconductor Physics' (BSC202X)");
        return;
    }

    console.log(`Found ${subjects.length} matching subjects:`);
    subjects.forEach(s => console.log(`- [${s.code}] ${s.name} (ID: ${s.id}, DeptID: ${s.department_id}, Sem: ${s.semester})`));

    const targetSubject = subjects[0];
    const deptId = targetSubject.department_id;
    const sem = targetSubject.semester;

    // 2. Check students with that Department ID
    console.log(`\nChecking students for Department ID: ${deptId}`);

    // Exact match
    const { count: exactCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', deptId);

    console.log(`> Students with exact department_id match: ${exactCount}`);

    // If 0, check what departments students DO have
    if (exactCount === 0) {
        const { data: sampleStudents } = await supabase
            .from('students')
            .select('roll_number, department_id, semester')
            .limit(5);
        console.log('\nSample Student Data (to check foreign keys):');
        console.log(sampleStudents);

        // Check if there's a department mismatch or if students have NULL department
        const { count: nullDeptCount } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .is('department_id', null);
        console.log(`> Students with NULL department_id: ${nullDeptCount}`);
    }
}

diagnose();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
    console.log('--- Checking Advisor Data ---');

    // 1. Get all advisors
    const { data: advisors, error: advError } = await supabase
        .from('class_advisors')
        .select('*, users(email, full_name)');

    if (advError) console.error('Error fetching advisors:', advError);
    console.log('Advisors found:', advisors?.length);
    console.dir(advisors, { depth: null });

    if (!advisors || advisors.length === 0) {
        console.log('NO ADVISORS FOUND. This is the problem.');
        return;
    }

    const advisor = advisors[0]; // Assuming testing with first advisor
    console.log(`\nChecking students for Advisor ${advisor.users?.email} (Sem ${advisor.semester}, Sec ${advisor.section})`);

    // 2. Check students matching this advisor
    const { data: students, error: stError } = await supabase
        .from('students')
        .select('id, roll_number, semester, section, users(full_name)')
        .eq('semester', advisor.semester)
        .eq('section', advisor.section);

    if (stError) console.error('Error fetching students:', stError);
    console.log(`Students found matching Sem ${advisor.semester} Sec ${advisor.section}:`, students?.length);
    if (students && students.length > 0) {
        console.log('Sample student:', students[0]);
    } else {
        console.log('NO STUDENTS MATCH THIS CRITERIA.');

        // 3. Check if ANY students exist
        const { data: allStudents } = await supabase.from('students').select('semester, section').limit(5);
        console.log('Sample of existing students in DB:', allStudents);
    }
}

checkData();

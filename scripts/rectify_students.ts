
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function rectify() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const ASH_DEPT_ID = '9f48097d-4cb5-48f4-8371-20d4932a4bd3';

    console.log('--- RECTIFYING STUDENT DATA ---');
    console.log('Target Department: Applied Science & Humanities (ASH)');
    console.log('Moving students from Semester 3 back to Semester 2...');

    // 1. Count affected students
    const { count: affectedCount, error: countError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', ASH_DEPT_ID)
        .eq('semester', 3);

    if (countError) {
        console.error('Error counting students:', countError);
        return;
    }

    if (affectedCount === 0) {
        console.log('No students found in Semester 3 for the ASH department.');
        return;
    }

    console.log(`Found ${affectedCount} students to update.`);

    // 2. Perform the update
    const { data, error: updateError } = await supabase
        .from('students')
        .update({ semester: 2 })
        .eq('department_id', ASH_DEPT_ID)
        .eq('semester', 3)
        .select();

    if (updateError) {
        console.error('Error updating students:', updateError);
        return;
    }

    console.log(`Successfully moved ${data?.length} students back to Semester 2!`);

    // 3. Final Verification
    const { count: finalCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', ASH_DEPT_ID)
        .eq('semester', 2);

    console.log(`Total students now in ASH Sem 2: ${finalCount}`);
}

rectify();

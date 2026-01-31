
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugReport() {
    console.log("Starting Debug Report...");

    // 1. Get an advisor (or mock one)
    // We'll just pick the first advisor
    const { data: advisors, error: advError } = await supabase
        .from('class_advisors')
        .select('*')
        .limit(1);

    if (advError || !advisors || advisors.length === 0) {
        console.error("No advisors found or error:", advError);
        return;
    }

    const advisor = advisors[0];
    console.log("Advisor found:", advisor);

    const { semester, department_id, section } = advisor;

    // 2. Fetch Subjects
    console.log(`Fetching subjects for Sem: ${semester}, Dept: ${department_id}`);
    const { data: subjects, error: subError } = await supabase
        .from('subjects')
        .select('id, code, name')
        .eq('semester', semester)
        .eq('department_id', department_id);

    if (subError) console.error("Subject Error:", subError);
    console.log("Subjects found:", subjects?.length, subjects);

    // 3. Fetch Students and check Batches
    const { data: students, error: stuError } = await supabase
        .from('students')
        .select('id, roll_number, batch')
        .eq('semester', semester)
        .eq('section', section);
    // .eq('department_id', department_id); // Removed restriction for now as advisor dept is null

    if (stuError) console.error("Student Error:", stuError);
    console.log("Students found:", students?.length);

    if (students && students.length > 0) {
        const batches = [...new Set(students.map(s => s.batch))];
        console.log("Available Batches:", batches);

        const b1Students = students.filter(s => s.batch === 'B1');
        console.log("Students in B1:", b1Students.length);
    }

    if (!students || students.length === 0) return;

    const studentIds = students.map(s => s.id);

    // 4. Fetch Attendance Records with Join
    console.log("Fetching attendance records...");
    const { data: attendanceData, error: attError } = await supabase
        .from('attendance_records')
        .select(`
            student_id,
            status,
            session:attendance_sessions!inner (
                subject_id,
                subjects (code)
            )
        `)
        .in('student_id', studentIds)
        .limit(5);

    if (attError) {
        console.error("Attendance Fetch Error:", attError);
    } else {
        console.log("Attendance Records Fetched:", attendanceData?.length);
    }
}

debugReport();

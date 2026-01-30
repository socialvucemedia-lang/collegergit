
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // These IDs were found using explore_db.ts
    const DEPT_ID = '9f48097d-4cb5-48f4-8371-20d4932a4bd3';
    const SUBJECT1_ID = 'cac36b23-d65f-410d-928c-363c40a0ff59'; // Applied Mathematics - II
    const SUBJECT2_ID = '3d2ca70f-26c3-4ac9-b592-517bd83273ce'; // Semiconductor Physics
    const TEACHER_ID = '5e660ec8-9385-4b57-9d02-c1400b51cbd3'; // Dr.Yograj Patil

    const slots = [
        // Monday (Day 1)
        { subject_id: SUBJECT1_ID, teacher_id: TEACHER_ID, day_of_week: 1, start_time: '09:00:00', end_time: '10:00:00', room: 'B101', section: 'A', semester: 2 },
        { subject_id: SUBJECT2_ID, teacher_id: TEACHER_ID, day_of_week: 1, start_time: '10:00:00', end_time: '11:00:00', room: 'B101', section: 'A', semester: 2 },

        // Tuesday (Day 2)
        { subject_id: SUBJECT1_ID, teacher_id: TEACHER_ID, day_of_week: 2, start_time: '11:00:00', end_time: '12:00:00', room: 'B202', section: 'A', semester: 2 },
        { subject_id: SUBJECT2_ID, teacher_id: TEACHER_ID, day_of_week: 2, start_time: '14:00:00', end_time: '15:00:00', room: 'B202', section: 'A', semester: 2 },

        // Wednesday (Day 3)
        { subject_id: SUBJECT1_ID, teacher_id: TEACHER_ID, day_of_week: 3, start_time: '09:00:00', end_time: '10:00:00', room: 'B101', section: 'B', semester: 2 },
        { subject_id: SUBJECT2_ID, teacher_id: TEACHER_ID, day_of_week: 3, start_time: '10:00:00', end_time: '11:00:00', room: 'B101', section: 'B', semester: 2 },
    ];

    console.log(`Inserting ${slots.length} timetable slots...`);

    const { data, error } = await supabase
        .from('timetable_slots')
        .insert(slots)
        .select();

    if (error) {
        console.error('Seeding Error:', error);
    } else {
        console.log(`Successfully seeded ${data?.length} slots.`);
    }
}

main();

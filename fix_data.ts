
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

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const DEPT_ID = '9f48097d-4cb5-48f4-8371-20d4932a4bd3';

    console.log(`Updating students in Dept ${DEPT_ID} to Semester 2, Section B...`);

    const { error } = await supabase
        .from('students')
        .update({
            semester: 2,
            section: 'B'
        })
        .eq('department_id', DEPT_ID)
        .is('section', null); // Only update those with null section to be safe

    if (error) {
        console.error('Update Error:', error);
    } else {
        console.log('Update Successful. Strict attendance filtering should now work.');
    }
}

main();


import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) return {};
        const content = fs.readFileSync(envPath, 'utf-8');
        const env: Record<string, string> = {};
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Attempting to insert test row...');

    // Need a company_id and responsible_id. 
    // I'll try to fetch a profile first to get valid IDs.
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, company_id')
        .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
        console.error('Could not fetch a profile to use for insert:', profileError);
        return;
    }

    const { id: responsible_id, company_id } = profiles[0];

    const { data, error } = await supabase
        .from('corrective_actions')
        .insert([{
            company_id,
            code: 'TEST-001',
            origin: 'Auditoria',
            description: 'Test description',
            deadline: new Date().toISOString(),
            responsible_id,
            status: 'open'
        }]);

    if (error) {
        console.error('Insert failed:', JSON.stringify(error, null, 2));
    } else {
        console.log('Insert successful:', data);
    }
}

testInsert();

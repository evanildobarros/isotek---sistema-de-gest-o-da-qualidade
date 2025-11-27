
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

async function checkSchema() {
    console.log('Querying information_schema for corrective_actions columns...');

    // Note: This might fail if RLS prevents access to information_schema, 
    // but it's worth a try. 
    // Often supabase-js doesn't expose a direct way to query information_schema 
    // easily without a stored procedure or raw sql if not enabled.
    // However, we can try to use the rpc if we had one, but we don't.
    // We can try to use the 'rpc' to run a query if there was a function, but we don't have one.

    // Actually, Supabase exposes a RESTful interface. We might not be able to query information_schema directly via the JS client 
    // if it's not exposed in the API.

    // Alternative: Try to select specific columns. If 'description' fails, try selecting just 'id'.

    console.log('Testing select on "description" column...');
    const { data: descData, error: descError } = await supabase
        .from('corrective_actions')
        .select('description')
        .limit(1);

    if (descError) {
        console.log('Error selecting description:', descError.message);
    } else {
        console.log('Select description success (column exists).');
    }

    console.log('Testing select on "id" column...');
    const { data: idData, error: idError } = await supabase
        .from('corrective_actions')
        .select('id')
        .limit(1);

    if (idError) {
        console.log('Error selecting id:', idError.message);
    } else {
        console.log('Select id success.');
    }
}

checkSchema();

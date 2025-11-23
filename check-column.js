
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumn() {
    console.log('Checking for user_id column in swot_analysis...');

    // We can't easily query information_schema with supabase-js directly if RLS is strict or permissions are limited,
    // but we can try a simple RPC or just infer from error.
    // However, let's try to just select and see if we can filter by user_id (which would fail if column doesn't exist).

    try {
        const { data, error } = await supabase
            .from('swot_analysis')
            .select('user_id')
            .limit(1);

        if (error) {
            console.error('Error selecting user_id:', error);
            if (error.message.includes('does not exist') || error.message.includes('Could not find')) {
                console.log('CONFIRMED: user_id column is missing or not visible.');
            }
        } else {
            console.log('SUCCESS: user_id column exists and is selectable.');
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

checkColumn();

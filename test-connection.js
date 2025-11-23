
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

console.log('URL:', supabaseUrl);
console.log('Key present:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('Testing connection...');

    // Test Select
    const { data: selectData, error: selectError } = await supabase
        .from('swot_analysis')
        .select('*')
        .limit(1);

    if (selectError) {
        console.error('Select Error:', JSON.stringify(selectError, null, 2));
    } else {
        console.log('Select Success:', selectData);
    }

    // Test Insert
    const { data: insertData, error: insertError } = await supabase
        .from('swot_analysis')
        .insert([
            {
                description: 'Test Item',
                impact: 'medio',
                type: 'forca',
                is_active: true
            }
        ])
        .select();

    if (insertError) {
        console.error('Insert Error:', JSON.stringify(insertError, null, 2));
    } else {
        console.log('Insert Success:', insertData);

        // Cleanup
        if (insertData && insertData[0]) {
            await supabase.from('swot_analysis').delete().eq('id', insertData[0].id);
        }
    }
}

test();

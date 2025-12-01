import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vyrlakldvaqanzhiaoxo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cmxha2xkdmFxYW56aGlhb3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDcxOTMsImV4cCI6MjA3OTM4MzE5M30.YY_7bN5dwaL503V4T0wH0SxGnKLq5fv8-rH3sBPhFdE'
const supabase = createClient(supabaseUrl, supabaseKey)

async function findUser() {
    console.log('Searching for Evanildo...')
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%Evanildo%')

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Users found:', JSON.stringify(data, null, 2))
    }
}

findUser()

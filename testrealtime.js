const { createClient } = require('@supabase/supabase-js')
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
// console.log(process.env, supabaseUrl, supabaseKey)

const client = createClient(supabaseUrl, supabaseKey);

const channel = client
    .channel('postgresChangesChannel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'Process'
    }, payload => console.log(payload))
    .subscribe()
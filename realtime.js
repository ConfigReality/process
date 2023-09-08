const { createClient } = require('@supabase/supabase-js')
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
// console.log(process.env, supabaseUrl, supabaseKey)

const client = createClient(supabaseUrl, supabaseKey);

const channelB = client
  .channel('table-db-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'Catalog',
    },
    (payload) => console.log('*****', payload)
  )
  .subscribe()
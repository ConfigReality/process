const { createClient } = require('@supabase/supabase-js')
const { authorize, listFiles } = require('./googleapi');
require('dotenv').config();

// TODOS
// 1. Create supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Create fn triggered by realtime event anche push in queue
/**
 * @param {TableDBChanges} payload
 */
const handleRealtime = (payload) => {
    // 2.1 Get the new record
    console.log(payload)
    const { new: newRecord } = payload.new;
    // 2.2 Retrieve image from the bucket
    authorize().then(listFiles).catch(console.error); //
    // 2.3 Save image to the local filesystem

    // 2.4 Remove image from the bucket
}

// 3. Add realtime trigger on the database
supabase
    .channel('table-db-changes')
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'Catalog',
        },
        handleRealtime
    )
    .subscribe((status, err) => console.log(status, err))
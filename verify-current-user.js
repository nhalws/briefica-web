const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ffkgcdzvgttjlsklupkl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZma2djZHp2Z3R0amxza2x1cGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzU5OTEsImV4cCI6MjA4MzA1MTk5MX0.4ZxXyTSEFMM8NfSGG-8JOGPHUNRiYTOgUPmxRFi0cwg';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`
⚠️  This script can't check the browser session from the backend.
    The issue is likely one of these:

1. Browser Cache/Cookie Issue
   - Try opening the dashboard in an incognito/private window
   - Or clear your browser cookies for localhost:3000

2. The user session might not be persisting properly
   - Check the browser console (F12) for errors
   - Look for any "Failed to fetch goldilex access" messages

3. Timing issue - the goldilex check runs before auth completes

Let me check if there's a Row Level Security (RLS) policy issue...
`);

async function checkRLS() {
  console.log('\n=== Checking if we can read goldilex_access with ANON key ===\n');

  // Try to read as if we're the noah user
  const noahUserId = 'cebc00d5-e17d-4d97-87ac-0cb3c2d90b15';

  const { data, error } = await supabase
    .from('goldilex_access')
    .select('*')
    .eq('user_id', noahUserId)
    .single();

  if (error) {
    console.log('❌ ERROR - RLS might be blocking the query!');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('\nThis means the frontend can\'t read the goldilex_access table.');
    console.log('You need to add an RLS policy in Supabase!');
  } else {
    console.log('✅ Query successful - RLS is properly configured');
    console.log('Data:', data);
  }
}

checkRLS().catch(console.error);

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ffkgcdzvgttjlsklupkl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZma2djZHp2Z3R0amxza2x1cGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzU5OTEsImV4cCI6MjA4MzA1MTk5MX0.4ZxXyTSEFMM8NfSGG-8JOGPHUNRiYTOgUPmxRFi0cwg';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZma2djZHp2Z3R0amxza2x1cGtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NTk5MSwiZXhwIjoyMDgzMDUxOTkxfQ.fsA2vf6j7N9Uh41UHsOM_XbtWKXConkBR-mukrMJwEE';

async function testRLS() {
  const noahUserId = 'cebc00d5-e17d-4d97-87ac-0cb3c2d90b15';

  console.log('=== Testing with ANON key (like the frontend) ===\n');
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  const { data: anonData, error: anonError } = await anonClient
    .from('goldilex_access')
    .select('*')
    .eq('user_id', noahUserId);

  console.log('ANON Result:');
  console.log('Data:', anonData);
  console.log('Error:', anonError);
  console.log('Row count:', anonData?.length || 0);

  console.log('\n=== Testing with SERVICE key (bypasses RLS) ===\n');
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: serviceData, error: serviceError } = await serviceClient
    .from('goldilex_access')
    .select('*')
    .eq('user_id', noahUserId);

  console.log('SERVICE Result:');
  console.log('Data:', serviceData);
  console.log('Error:', serviceError);

  console.log('\n=== DIAGNOSIS ===\n');
  if ((anonData?.length || 0) === 0 && (serviceData?.length || 0) > 0) {
    console.log('❌ CONFIRMED: RLS is blocking the frontend query!');
    console.log('\nThe goldilex_access table is missing an RLS policy.');
    console.log('Users need permission to read their own goldilex_access records.\n');
  } else if ((anonData?.length || 0) > 0) {
    console.log('✅ RLS is working correctly - data is accessible');
    console.log('The issue must be something else (session, browser cache, etc.)');
  }
}

testRLS().catch(console.error);

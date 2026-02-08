const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ffkgcdzvgttjlsklupkl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZma2djZHp2Z3R0amxza2x1cGtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NTk5MSwiZXhwIjoyMDgzMDUxOTkxfQ.fsA2vf6j7N9Uh41UHsOM_XbtWKXConkBR-mukrMJwEE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPolicies() {
  console.log('=== Checking RLS Policies on goldilex_access table ===\n');

  // Query pg_policies to see what policies exist
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'goldilex_access');

  if (error) {
    console.error('Error querying policies:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No policies found on goldilex_access table!');
    console.log('\nThe SQL might not have executed correctly.');
    console.log('Try running this in Supabase SQL Editor again:\n');
    console.log(`
ALTER TABLE goldilex_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own goldilex access" ON goldilex_access;

CREATE POLICY "Users can read their own goldilex access"
ON goldilex_access
FOR SELECT
USING (auth.uid() = user_id);
    `);
  } else {
    console.log(`✅ Found ${data.length} policy/policies:\n`);
    data.forEach((policy, i) => {
      console.log(`Policy ${i + 1}:`);
      console.log('  Name:', policy.policyname);
      console.log('  Command:', policy.cmd);
      console.log('  Roles:', policy.roles);
      console.log('  USING clause:', policy.qual);
      console.log('  WITH CHECK clause:', policy.with_check);
      console.log('');
    });
  }

  // Also check if RLS is enabled
  const { data: tableData, error: tableError } = await supabase.rpc('exec', {
    sql: `
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relname = 'goldilex_access';
    `
  });

  if (!tableError && tableData) {
    console.log('Table RLS status:', tableData);
  }
}

checkPolicies().catch(console.error);

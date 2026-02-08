const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ffkgcdzvgttjlsklupkl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZma2djZHp2Z3R0amxza2x1cGtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NTk5MSwiZXhwIjoyMDgzMDUxOTkxfQ.fsA2vf6j7N9Uh41UHsOM_XbtWKXConkBR-mukrMJwEE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFix() {
  console.log('🔧 Applying RLS policy fix for goldilex_access table...\n');

  try {
    // Execute the SQL to add the RLS policy
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on the table
        ALTER TABLE goldilex_access ENABLE ROW LEVEL SECURITY;

        -- Drop existing policy if it exists
        DROP POLICY IF EXISTS "Users can read their own goldilex access" ON goldilex_access;

        -- Create policy: Users can read their own goldilex_access record
        CREATE POLICY "Users can read their own goldilex access"
        ON goldilex_access
        FOR SELECT
        USING (auth.uid() = user_id);
      `
    });

    if (error) {
      console.log('⚠️  The exec_sql function is not available.');
      console.log('You need to run the SQL manually in Supabase Dashboard.\n');
      console.log('Go to: https://supabase.com/dashboard/project/ffkgcdzvgttjlsklupkl/editor');
      console.log('Navigate to SQL Editor and run the commands from fix-goldilex-rls.sql\n');
      console.log('Or use the Supabase CLI: supabase db push\n');
    } else {
      console.log('✅ RLS policy applied successfully!\n');
    }
  } catch (err) {
    console.log('⚠️  Could not apply fix automatically.');
    console.log('Error:', err.message);
    console.log('\n📝 Manual steps to fix:');
    console.log('1. Go to https://supabase.com/dashboard/project/ffkgcdzvgttjlsklupkl/editor');
    console.log('2. Click on "SQL Editor" in the left sidebar');
    console.log('3. Click "New Query"');
    console.log('4. Copy and paste the contents of fix-goldilex-rls.sql');
    console.log('5. Click "Run" or press Cmd+Enter\n');
  }
}

applyFix().catch(console.error);

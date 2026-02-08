const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ffkgcdzvgttjlsklupkl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZma2djZHp2Z3R0amxza2x1cGtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NTk5MSwiZXhwIjoyMDgzMDUxOTkxfQ.fsA2vf6j7N9Uh41UHsOM_XbtWKXConkBR-mukrMJwEE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGoldilexAccess() {
  console.log('=== Checking Goldilex Access ===\n');

  // Get all users
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, username');

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  console.log(`Found ${profiles.length} users:\n`);

  // Check goldilex_access for each user
  for (const profile of profiles) {
    console.log(`User: @${profile.username} (${profile.user_id})`);

    const { data: access, error: accessError } = await supabase
      .from('goldilex_access')
      .select('*')
      .eq('user_id', profile.user_id)
      .single();

    if (accessError) {
      console.log(`  ❌ No goldilex_access record found`);
      console.log(`  Error: ${accessError.message}\n`);
    } else {
      console.log(`  Tier: ${access.tier}`);
      console.log(`  Approved: ${access.approved}`);
      console.log(`  Gold Member Number: ${access.gold_member_number || 'N/A'}`);

      const hasAccess = access.tier === 'gold' && access.approved === true;
      console.log(`  ✓ Has Goldilex Access: ${hasAccess ? 'YES ✅' : 'NO ❌'}\n`);
    }
  }

  // Also show all records in goldilex_access table
  console.log('\n=== All Goldilex Access Records ===\n');
  const { data: allAccess, error: allError } = await supabase
    .from('goldilex_access')
    .select('*');

  if (allError) {
    console.error('Error fetching all access records:', allError);
  } else {
    console.table(allAccess);
  }
}

checkGoldilexAccess().catch(console.error);

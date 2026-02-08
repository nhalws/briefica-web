const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabaseUrl = 'https://ffkgcdzvgttjlsklupkl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZma2djZHp2Z3R0amxza2x1cGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzU5OTEsImV4cCI6MjA4MzA1MTk5MX0.4ZxXyTSEFMM8NfSGG-8JOGPHUNRiYTOgUPmxRFi0cwg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testAuthenticatedAccess() {
  console.log('=== Testing Authenticated Goldilex Access ===\n');

  const email = await question('Enter your email: ');
  const password = await question('Enter your password: ');

  console.log('\nAttempting to sign in...');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim()
  });

  if (authError) {
    console.error('❌ Sign in failed:', authError.message);
    rl.close();
    return;
  }

  console.log('✅ Signed in successfully!');
  console.log('User ID:', authData.user.id);

  // Now try to read goldilex_access with the authenticated session
  console.log('\nQuerying goldilex_access table...');

  const { data: accessData, error: accessError } = await supabase
    .from('goldilex_access')
    .select('*')
    .eq('user_id', authData.user.id)
    .single();

  if (accessError) {
    console.log('❌ Query failed:', accessError.message);
    console.log('Code:', accessError.code);
    console.log('\nThe RLS policy is still blocking the query!');
  } else {
    console.log('✅ Query successful!');
    console.log('\nGoldilex Access Data:');
    console.log('  Tier:', accessData.tier);
    console.log('  Approved:', accessData.approved);
    console.log('  Gold Member Number:', accessData.gold_member_number);

    const hasAccess = accessData.tier === 'gold' && accessData.approved === true;
    console.log(`\n${hasAccess ? '✅' : '❌'} Has Goldilex Access: ${hasAccess ? 'YES' : 'NO'}`);

    if (hasAccess) {
      console.log('\n🎉 SUCCESS! The RLS policy is working correctly!');
      console.log('The frontend should now be able to detect your gold access.');
    }
  }

  rl.close();
}

testAuthenticatedAccess().catch((err) => {
  console.error('Error:', err);
  rl.close();
});

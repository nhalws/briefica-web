import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Get auth header
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  // Test with ANON key (like the frontend)
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  if (token) {
    // Set the session
    await anonClient.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
  }

  const { data: { user }, error: userError } = await anonClient.auth.getUser();

  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    user: user ? {
      id: user.id,
      email: user.email,
    } : null,
    userError: userError?.message || null,
  };

  if (user) {
    // Try to query goldilex_access with the authenticated session
    const { data: anonData, error: anonError } = await anonClient
      .from('goldilex_access')
      .select('*')
      .eq('user_id', user.id)
      .single();

    debugInfo.anonQuery = {
      data: anonData,
      error: anonError?.message || null,
      errorCode: anonError?.code || null,
    };

    // Try with service key (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('goldilex_access')
      .select('*')
      .eq('user_id', user.id)
      .single();

    debugInfo.serviceQuery = {
      data: serviceData,
      error: serviceError?.message || null,
    };

    debugInfo.diagnosis = {
      rlsBlocking: !anonData && !!serviceData,
      hasGoldAccess: serviceData?.tier === 'gold' && serviceData?.approved === true,
    };
  }

  return NextResponse.json(debugInfo, { status: 200 });
}

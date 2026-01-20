import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const artifactId = params.id;

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call like_artifact function
    const { data, error } = await supabase.rpc('like_artifact', {
      user_uuid: user.id,
      artifact_uuid: artifactId
    });

    if (error) {
      console.error('Error liking artifact:', error);
      return NextResponse.json(
        { error: 'Failed to like artifact' },
        { status: 500 }
      );
    }

    // Check if the function returned an error in its response
    if (data && !data.success) {
      return NextResponse.json(
        { error: data.error || 'Failed to like artifact' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in /api/artifacts/[id]/like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const artifactId = params.id;

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call unlike_artifact function
    const { data, error } = await supabase.rpc('unlike_artifact', {
      user_uuid: user.id,
      artifact_uuid: artifactId
    });

    if (error) {
      console.error('Error unliking artifact:', error);
      return NextResponse.json(
        { error: 'Failed to unlike artifact' },
        { status: 500 }
      );
    }

    // Check if the function returned an error in its response
    if (data && !data.success) {
      return NextResponse.json(
        { error: data.error || 'Failed to unlike artifact' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in /api/artifacts/[id]/like DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
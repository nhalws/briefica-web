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

    // Check if user can download (has BBs available)
    const { data: canDownload, error: checkError } = await supabase.rpc('can_download_artifact', {
      user_uuid: user.id
    });

    if (checkError) {
      console.error('Error checking download permission:', checkError);
      return NextResponse.json(
        { error: 'Failed to check download permission' },
        { status: 500 }
      );
    }

    if (!canDownload) {
      return NextResponse.json(
        { 
          error: 'Not enough briefica bucks. Purchase more or upgrade to gold.',
          code: 'INSUFFICIENT_BBS'
        },
        { status: 403 }
      );
    }

    // Get artifact details
    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .select('*')
      .eq('id', artifactId)
      .single();

    if (artifactError || !artifact) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    // Consume 1 BB
    const { error: consumeError } = await supabase.rpc('consume_bb', {
      user_uuid: user.id,
      artifact_uuid: artifactId
    });

    if (consumeError) {
      console.error('Error consuming BB:', consumeError);
      return NextResponse.json(
        { error: 'Failed to process download' },
        { status: 500 }
      );
    }

    // Get download URL from Supabase Storage
    const { data: urlData } = await supabase.storage
      .from('artifacts')
      .createSignedUrl(artifact.storage_key, 60); // 60 second expiry

    if (!urlData) {
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      download_url: urlData.signedUrl,
      artifact: {
        id: artifact.id,
        title: artifact.title,
        filename: artifact.original_filename
      }
    });

  } catch (error) {
    console.error('Error in /api/artifacts/[id]/download:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Grade Submission API called ===');

    // Parse request body
    const body = await request.json();
    const {
      grading_key,
      claimed_grade,
      claimed_grade_gpa,
      course,
      professor,
      semester,
      screenshot_url,
      student_email
    } = body;

    console.log('Grading key:', grading_key);

    // Validate required fields
    if (!grading_key || !claimed_grade || !claimed_grade_gpa || !course || !professor || !semester || !screenshot_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Verify grading key exists and belongs to an artifact
    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .select('id, user_id, title')
      .eq('grading_key', grading_key)
      .single();

    if (artifactError || !artifact) {
      console.error('Grading key not found:', artifactError);
      return NextResponse.json(
        { error: 'Invalid grading key. This key does not exist in our system.' },
        { status: 400 }
      );
    }

    // Verify the artifact belongs to the user submitting the grade
    if (artifact.user_id !== user.id) {
      console.error('User mismatch:', artifact.user_id, 'vs', user.id);
      return NextResponse.json(
        { error: 'This grading key does not belong to you.' },
        { status: 403 }
      );
    }

    console.log('Artifact found:', artifact.id);

    // Check if this grading key already has a pending or approved submission
    const { data: existingSubmission, error: checkError } = await supabase
      .from('grade_submissions')
      .select('id, status')
      .eq('grading_key', grading_key)
      .in('status', ['pending', 'approved'])
      .single();

    if (existingSubmission) {
      console.log('Existing submission found:', existingSubmission);
      return NextResponse.json(
        { error: `This grading key already has a ${existingSubmission.status} submission.` },
        { status: 400 }
      );
    }

    // Insert grade submission
    const { data: submission, error: insertError } = await supabase
      .from('grade_submissions')
      .insert({
        grading_key,
        user_id: user.id,
        artifact_id: artifact.id,
        claimed_grade,
        claimed_grade_gpa: parseFloat(claimed_grade_gpa),
        course,
        professor,
        semester,
        screenshot_url,
        student_email,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit grade verification' },
        { status: 500 }
      );
    }

    console.log('Submission created:', submission.id);

    // TODO: Send email notification to admin (grades@briefica.com)
    // For now, we'll skip this and just log it
    console.log('TODO: Send email to grades@briefica.com with submission details');

    return NextResponse.json({
      success: true,
      submission_id: submission.id,
      message: 'Grade submitted for review'
    });

  } catch (error: any) {
    console.error('=== Grade Submission API Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to submit grade verification',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
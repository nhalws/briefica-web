import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin user IDs - replace with your actual user ID
const ADMIN_USER_IDS = [
  'cebc00d5-e17d-4d97-87ac-0cb3c2d90b15', // Your user ID - replace this!
];

export async function POST(request: NextRequest) {
  try {
    console.log('=== Grade Review API called ===');

    // Parse request body
    const body = await request.json();
    const { submission_id, action, rejection_reason } = body;

    console.log('Submission ID:', submission_id);
    console.log('Action:', action);

    // Validate required fields
    if (!submission_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejection_reason?.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting' },
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

    // Check if user is admin
    if (!ADMIN_USER_IDS.includes(user.id)) {
      console.error('User is not admin:', user.id);
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    console.log('Admin user authenticated:', user.id);

    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('grade_submissions')
      .select('*')
      .eq('id', submission_id)
      .single();

    if (submissionError || !submission) {
      console.error('Submission not found:', submissionError);
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: `Submission already ${submission.status}` },
        { status: 400 }
      );
    }

    console.log('Processing submission:', submission.id);

    if (action === 'approve') {
      // Update submission status
      const { error: updateSubmissionError } = await supabase
        .from('grade_submissions')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submission_id);

      if (updateSubmissionError) {
        console.error('Error updating submission:', updateSubmissionError);
        return NextResponse.json(
          { error: 'Failed to update submission' },
          { status: 500 }
        );
      }

      // Update artifact with verified grade
      const updateData: any = {
        verified_grade_gpa: submission.claimed_grade_gpa,
        verified_at: new Date().toISOString()
      };

      // Add Top Grade badge if GPA >= 3.7 (A-)
      if (submission.claimed_grade_gpa >= 3.7) {
        updateData.has_top_grade_badge = true;
      }

      const { error: updateArtifactError } = await supabase
        .from('artifacts')
        .update(updateData)
        .eq('id', submission.artifact_id);

      if (updateArtifactError) {
        console.error('Error updating artifact:', updateArtifactError);
        return NextResponse.json(
          { error: 'Failed to update artifact' },
          { status: 500 }
        );
      }

      console.log('Grade approved and artifact updated');

      // TODO: Send approval email to student
      console.log('TODO: Send approval email to', submission.student_email);

      return NextResponse.json({
        success: true,
        message: 'Grade approved',
        badge_added: submission.claimed_grade_gpa >= 3.7
      });

    } else if (action === 'reject') {
      // Update submission status with rejection reason
      const { error: updateSubmissionError } = await supabase
        .from('grade_submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejection_reason.trim(),
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submission_id);

      if (updateSubmissionError) {
        console.error('Error updating submission:', updateSubmissionError);
        return NextResponse.json(
          { error: 'Failed to update submission' },
          { status: 500 }
        );
      }

      console.log('Grade rejected');

      // TODO: Send rejection email to student with reason
      console.log('TODO: Send rejection email to', submission.student_email, 'with reason:', rejection_reason);

      return NextResponse.json({
        success: true,
        message: 'Grade rejected'
      });
    }

  } catch (error: any) {
    console.error('=== Grade Review API Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to process grade review',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
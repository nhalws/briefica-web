'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface GradeSubmission {
  id: string;
  grading_key: string;
  user_id: string;
  artifact_id: string;
  claimed_grade: string;
  claimed_grade_gpa: number;
  course: string;
  professor: string;
  semester: string;
  screenshot_url: string;
  student_email: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  artifact?: {
    title: string;
  };
}

export default function AdminGradesPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<GradeSubmission[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<GradeSubmission | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Admin user IDs (replace with your actual user ID)
  const ADMIN_USER_IDS = [
    'cebc00d5-e17d-4d97-87ac-0cb3c2d90b15', // Your user ID - replace this!
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (session) {
      fetchSubmissions();
    }
  }, [session, filter]);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      redirect('/login');
      return;
    }

    // Check if user is admin
    if (!ADMIN_USER_IDS.includes(session.user.id)) {
      redirect('/dashboard');
      return;
    }

    setSession(session);
    setLoading(false);
  }

  async function fetchSubmissions() {
    try {
      let query = supabase
        .from('grade_submissions')
        .select(`
          *,
          artifact:artifacts(title)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching submissions:', error);
        return;
      }

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleApprove(submissionId: string) {
    if (!confirm('Approve this grade submission?')) return;

    setProcessingId(submissionId);

    try {
      const response = await fetch('/api/grades/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          submission_id: submissionId,
          action: 'approve'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to approve submission');
        setProcessingId(null);
        return;
      }

      alert('Grade approved! Badge added to artifact.');
      fetchSubmissions();
      setSelectedSubmission(null);

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to approve submission');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(submissionId: string) {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!confirm('Reject this grade submission?')) return;

    setProcessingId(submissionId);

    try {
      const response = await fetch('/api/grades/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          submission_id: submissionId,
          action: 'reject',
          rejection_reason: rejectionReason.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to reject submission');
        setProcessingId(null);
        return;
      }

      alert('Grade rejected. Student notified.');
      fetchSubmissions();
      setSelectedSubmission(null);
      setRejectionReason('');

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to reject submission');
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Grade Review Admin</h1>
          <p className="text-gray-400">
            Review and approve student grade submissions
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && submissions.filter(s => s.status === 'pending').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {submissions.filter(s => s.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No {filter !== 'all' ? filter : ''} submissions found
          </div>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        submission.status === 'pending'
                          ? 'bg-yellow-900 text-yellow-300'
                          : submission.status === 'approved'
                          ? 'bg-green-900 text-green-300'
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {submission.status.toUpperCase()}
                      </span>
                      <span className="text-2xl font-bold">{submission.claimed_grade}</span>
                      <span className="text-gray-500">({submission.claimed_grade_gpa.toFixed(1)} GPA)</span>
                    </div>

                    <h3 className="font-semibold text-lg mb-1">
                      {submission.artifact?.title || 'Unknown Artifact'}
                    </h3>

                    <div className="text-sm text-gray-400 space-y-1">
                      <p><strong>Course:</strong> {submission.course}</p>
                      <p><strong>Professor:</strong> {submission.professor}</p>
                      <p><strong>Semester:</strong> {submission.semester}</p>
                      <p><strong>Student:</strong> {submission.student_email}</p>
                      <p><strong>Submitted:</strong> {new Date(submission.created_at).toLocaleString()}</p>
                      {submission.rejection_reason && (
                        <p className="text-red-400">
                          <strong>Rejection Reason:</strong> {submission.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                    >
                      View Details
                    </button>
                    {submission.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(submission.id)}
                          disabled={processingId === submission.id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium disabled:opacity-50"
                        >
                          {processingId === submission.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            // Scroll to rejection reason input
                          }}
                          disabled={processingId === submission.id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">Grade Submission Details</h2>
                  <button
                    onClick={() => {
                      setSelectedSubmission(null);
                      setRejectionReason('');
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Screenshot */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Grade Screenshot:</h3>
                  <img
                    src={selectedSubmission.screenshot_url}
                    alt="Grade screenshot"
                    className="w-full border border-gray-700 rounded"
                  />
                </div>

                {/* Submission Info */}
                <div className="bg-gray-900 rounded p-4 mb-6">
                  <h3 className="font-semibold mb-3">Submission Information:</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Grade:</p>
                      <p className="font-medium">{selectedSubmission.claimed_grade} ({selectedSubmission.claimed_grade_gpa.toFixed(1)} GPA)</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Course:</p>
                      <p className="font-medium">{selectedSubmission.course}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Professor:</p>
                      <p className="font-medium">{selectedSubmission.professor}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Semester:</p>
                      <p className="font-medium">{selectedSubmission.semester}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Student Email:</p>
                      <p className="font-medium">{selectedSubmission.student_email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Grading Key:</p>
                      <p className="font-mono text-xs">{selectedSubmission.grading_key}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedSubmission.status === 'pending' && (
                  <div className="space-y-4">
                    {/* Rejection Reason */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Rejection Reason (if rejecting):
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g., Screenshot is unclear, grade doesn't match..."
                        rows={3}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleApprove(selectedSubmission.id)}
                        disabled={processingId === selectedSubmission.id}
                        className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded font-medium disabled:opacity-50"
                      >
                        {processingId === selectedSubmission.id ? 'Processing...' : '✓ Approve Grade'}
                      </button>
                      <button
                        onClick={() => handleReject(selectedSubmission.id)}
                        disabled={processingId === selectedSubmission.id || !rejectionReason.trim()}
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded font-medium disabled:opacity-50"
                      >
                        {processingId === selectedSubmission.id ? 'Processing...' : '✕ Reject Grade'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
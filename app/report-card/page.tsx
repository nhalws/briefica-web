'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Upload {
  id: string;
  title: string;
  grade_gpa: number | null;
  grade_letter: string | null;
  has_top_grade: boolean;
  likes_count: number;
  downloads_count: number;
  created_at: string;
}

interface ReportCard {
  total_likes: number;
  total_downloads: number;
  average_grade_gpa: number;
  average_grade_letter: string;
  uploads: Upload[];
}

export default function ReportCardPage() {
  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      redirect('/login');
      return;
    }
    setSession(session);
    fetchReportCard(session);
  }

  async function fetchReportCard(session: any) {
    try {
      const response = await fetch('/api/users/me/report-card', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReportCard(data);
      }
    } catch (error) {
      console.error('Error fetching report card:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!reportCard) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Failed to load report card</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Report Card</h1>
          <p className="text-gray-400">Only you can see this</p>
        </div>

        {/* Overall Stats */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Overall Performance</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Average Grade</p>
              <p className="text-3xl font-bold text-blue-400">
                {reportCard.average_grade_letter}
              </p>
              {reportCard.average_grade_gpa > 0 && (
                <p className="text-sm text-gray-500">
                  {reportCard.average_grade_gpa.toFixed(2)} GPA
                </p>
              )}
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Likes</p>
              <p className="text-3xl font-bold text-pink-400">
                {reportCard.total_likes}
              </p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Downloads</p>
              <p className="text-3xl font-bold text-green-400">
                {reportCard.total_downloads}
              </p>
            </div>
          </div>
        </div>

        {/* Uploads */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Uploads</h2>
          
          {reportCard.uploads.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">You haven't uploaded any artifacts yet</p>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Upload Your First Artifact
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reportCard.uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{upload.title}</h3>
                      <p className="text-sm text-gray-500">
                        Uploaded {new Date(upload.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {upload.has_top_grade && (
                      <span className="text-2xl">🏆</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Grade</p>
                      {upload.grade_letter ? (
                        <p className="font-semibold text-blue-400">
                          {upload.grade_letter}
                          {upload.grade_gpa && (
                            <span className="text-gray-500 ml-1">
                              ({upload.grade_gpa.toFixed(1)})
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-gray-500">Not graded</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-gray-400 mb-1">Likes</p>
                      <p className="font-semibold text-pink-400">
                        {upload.likes_count}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 mb-1">Downloads</p>
                      <p className="font-semibold text-green-400">
                        {upload.downloads_count}
                      </p>
                    </div>
                  </div>

                  {upload.grade_gpa !== null && upload.grade_gpa < 3.7 && (
                    <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-600 rounded">
                      <p className="text-sm text-yellow-500">
                        💡 Tip: Need A- or higher (3.7 GPA) for Top Grade badge
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
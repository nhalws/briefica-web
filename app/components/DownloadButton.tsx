'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DownloadButtonProps {
  artifactId: string;
  filename: string;
  onDownloadComplete?: () => void;
}

export function DownloadButton({ 
  artifactId, 
  filename,
  onDownloadComplete 
}: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to download');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/artifacts/${artifactId}/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'INSUFFICIENT_BBS') {
          setError(data.error);
        } else {
          setError('Failed to download artifact');
        }
        setLoading(false);
        return;
      }

      // Download the file
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (onDownloadComplete) {
        onDownloadComplete();
      }

    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download artifact');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors flex items-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Downloading...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download - 1 BB
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 p-3 bg-red-900/20 border border-red-600 rounded">
          <p className="text-sm text-red-300">{error}</p>
          {error.includes('briefica bucks') && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => window.location.href = '/buy-bbs'}
                className="text-sm text-blue-400 hover:underline"
              >
                Buy BBs
              </button>
              <button
                onClick={() => window.location.href = '/pricing'}
                className="text-sm text-yellow-400 hover:underline"
              >
                Upgrade to Gold
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
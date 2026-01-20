'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface LikeButtonProps {
  artifactId: string;
  initialLiked?: boolean;
}

export function LikeButton({ artifactId, initialLiked = false }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  async function handleToggleLike() {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please sign in to like artifacts');
        setLoading(false);
        return;
      }

      const method = liked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/artifacts/${artifactId}/like`, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        setLiked(!liked);
      } else {
        const data = await response.json();
        console.error('Like error:', data.error);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggleLike}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="text-lg">
        {liked ? '❤️' : '🤍'}
      </span>
      <span className="text-sm font-medium">
        {liked ? 'Liked' : 'Like'}
      </span>
    </button>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type Artifact = {
  id: string;
  owner_id: string;
  type: "bset" | "bmod" | "tbank";
  title: string;
  description: string | null;
  storage_key: string;
  visibility: "private" | "unlisted" | "public";
  created_at: string;
  original_filename: string | null;
};

type Profile = {
  username: string;
};

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
};

export default function ArtifactPage() {
  const router = useRouter();
  const params = useParams();
  const artifactId = params?.id;

  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [uploader, setUploader] = useState<Profile | null>(null);
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [shareCount, setShareCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const badge = useMemo(() => {
    const t = artifact?.type ?? "bset";
    return t === "bset" ? ".bset" : t === "bmod" ? ".bmod" : ".tbank";
  }, [artifact?.type]);

  useEffect(() => {
    async function getCurrentUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    }
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!artifactId || typeof artifactId !== "string") return;

    async function load() {
      setMsg(null);

      const { data: a, error: aErr } = await supabase
        .from("artifacts")
        .select("*")
        .eq("id", artifactId)
        .single();

      if (aErr) {
        setMsg(aErr.message);
        return;
      }
      setArtifact(a);

      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", a.owner_id)
        .single();

      if (!pErr) setUploader(p);

      // Load download count
      const { count: dlCount } = await supabase
        .from("artifact_downloads")
        .select("id", { count: "exact", head: true })
        .eq("artifact_id", a.id);

      setDownloadCount(dlCount ?? 0);

      // Load like count
      const { count: likeC } = await supabase
        .from("artifact_likes")
        .select("id", { count: "exact", head: true })
        .eq("artifact_id", a.id);

      setLikeCount(likeC ?? 0);

      // Load share count
      const { count: shareC } = await supabase
        .from("artifact_shares")
        .select("id", { count: "exact", head: true })
        .eq("artifact_id", a.id);

      setShareCount(shareC ?? 0);

      // Load comments
      await loadComments(a.id);
    }

    load();
  }, [artifactId]);

  useEffect(() => {
    if (!artifactId || !currentUserId) return;

    async function checkUserInteractions() {
      // Check if user liked
      const { data: likeData } = await supabase
        .from("artifact_likes")
        .select("id")
        .eq("artifact_id", artifactId)
        .eq("user_id", currentUserId)
        .single();

      setIsLiked(!!likeData);

      // Check if user shared
      const { data: shareData } = await supabase
        .from("artifact_shares")
        .select("id")
        .eq("artifact_id", artifactId)
        .eq("user_id", currentUserId)
        .single();

      setIsShared(!!shareData);
    }

    checkUserInteractions();
  }, [artifactId, currentUserId]);

  async function loadComments(artId: string) {
    const { data: commentsData } = await supabase
      .from("artifact_comments")
      .select(`
        id,
        user_id,
        content,
        created_at,
        profiles!artifact_comments_user_id_fkey(username)
      `)
      .eq("artifact_id", artId)
      .order("created_at", { ascending: true });

    if (commentsData) {
      const formatted = commentsData.map((c: any) => ({
        id: c.id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        username: c.profiles?.username ?? "unknown",
      }));
      setComments(formatted);
    }
  }

  async function toggleLike() {
    if (!currentUserId || !artifactId) return;

    if (isLiked) {
      // Unlike
      await supabase
        .from("artifact_likes")
        .delete()
        .eq("artifact_id", artifactId)
        .eq("user_id", currentUserId);

      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      // Like
      await supabase.from("artifact_likes").insert({
        artifact_id: artifactId,
        user_id: currentUserId,
      });

      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  }

  async function toggleShare() {
    if (!currentUserId || !artifactId) return;

    if (isShared) {
      // Unshare
      await supabase
        .from("artifact_shares")
        .delete()
        .eq("artifact_id", artifactId)
        .eq("user_id", currentUserId);

      setIsShared(false);
      setShareCount((prev) => Math.max(0, prev - 1));
    } else {
      // Share
      await supabase.from("artifact_shares").insert({
        artifact_id: artifactId,
        user_id: currentUserId,
      });

      setIsShared(true);
      setShareCount((prev) => prev + 1);
    }
  }

  async function postComment() {
    if (!currentUserId || !artifactId || !newComment.trim()) return;

    setBusy(true);
    try {
      const { error } = await supabase.from("artifact_comments").insert({
        artifact_id: artifactId,
        user_id: currentUserId,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      await loadComments(artifactId as string);
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to post comment.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment(commentId: string) {
    if (!currentUserId) return;

    const { error } = await supabase
      .from("artifact_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", currentUserId);

    if (!error && artifactId) {
      await loadComments(artifactId as string);
    }
  }

  async function download() {
    if (!artifact) return;
    setBusy(true);
    setMsg(null);

    try {
      // Record download (don't require authentication for public artifacts)
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;

      if (uid) {
        await supabase.from("artifact_downloads").insert({
          artifact_id: artifact.id,
          user_id: uid,
        });
      }

      // Get signed URL with longer expiration
      const { data, error } = await supabase.storage
        .from("artifacts")
        .createSignedUrl(artifact.storage_key, 300); // 5 minutes

      if (error) {
        console.error("Storage error:", error);
        throw new Error("Failed to generate download link. Please try again.");
      }

      if (!data?.signedUrl) {
        throw new Error("No download URL generated");
      }

      // Download with original filename
      const filename = artifact.original_filename || `artifact.${artifact.type}`;
      
      try {
        const response = await fetch(data.signedUrl);
        if (!response.ok) {
          throw new Error(`Download failed: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setDownloadCount((prev) => prev + 1);
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw new Error("Failed to download file. Please check your connection.");
      }
    } catch (e: any) {
      console.error("Download error:", e);
      setMsg(e?.message ?? "Download failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!artifactId) {
    return (
      <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
        <p className="text-white/70">Loading...</p>
      </main>
    );
  }

  if (!artifact) {
    return (
      <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
        <p className="text-white/70">{msg ?? "Loading..."}</p>
        <button
          className="mt-4 border border-white/20 rounded px-3 py-2 hover:bg-white/5 transition-colors"
          onClick={() => router.push("/dashboard")}
        >
          Back
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-white/60">
              <span className="inline-block px-2 py-1 rounded bg-white/10 border border-white/10">
                {badge}
              </span>
              <span className="ml-3">
                {new Date(artifact.created_at).toLocaleString()}
              </span>
            </div>

            {uploader?.username ? (
              <button
                className="text-sm text-white/80 hover:text-white underline"
                onClick={() => router.push(`/u/${uploader.username}`)}
              >
                @{uploader.username}
              </button>
            ) : (
              <span className="text-sm text-white/50">Unknown uploader</span>
            )}
          </div>

          <h1 className="text-2xl font-semibold mt-4">{artifact.title}</h1>
          {artifact.description && (
            <p className="text-white/70 mt-2">{artifact.description}</p>
          )}

          <div className="text-sm text-white/60 mt-4">
            Downloads: <span className="text-white/80">{downloadCount}</span>
          </div>

          {/* Like and Share Stats */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <button
              onClick={toggleLike}
              disabled={!currentUserId}
              className={`flex items-center gap-1.5 transition-colors ${
                isLiked
                  ? "text-red-400"
                  : "text-white/60 hover:text-white/80"
              } ${!currentUserId ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <svg
                className="w-6 h-6"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{likeCount}</span>
            </button>

            <button
              onClick={toggleShare}
              disabled={!currentUserId}
              className={`flex items-center gap-1.5 transition-colors ${
                isShared
                  ? ""
                  : "text-white/60 hover:text-white/80"
              } ${!currentUserId ? "opacity-50 cursor-not-allowed" : ""}`}
              style={isShared ? { color: '#66b2ff' } : {}}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span>{shareCount}</span>
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={download}
              disabled={busy}
              className="bg-white text-black rounded-lg py-2 px-4 font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {busy ? "Preparing..." : "Download"}
            </button>

            <div className="text-xs text-white/60 border border-white/10 rounded-lg p-3 bg-[#2b2b2b]">
              <div className="font-medium text-white/80 mb-1">Open in Briefica</div>
              <div>
                After download, double-click the file (or open it inside Briefica).
                This is a native Briefica artifact.
              </div>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {msg && <p className="text-sm text-red-400 mt-4">{msg}</p>}
        </div>

        {/* COMMENTS SECTION */}
        <div className="mt-6 border border-white/10 bg-[#1e1e1e] rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            Comments ({comments.length})
          </h2>

          {/* Add Comment */}
          {currentUserId ? (
            <div className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none resize-none"
              />
              <button
                onClick={postComment}
                disabled={busy || !newComment.trim()}
                className="mt-2 bg-white text-black rounded-lg py-2 px-4 font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {busy ? "Posting..." : "Post Comment"}
              </button>
            </div>
          ) : (
            <div className="mb-6 text-sm text-white/60">
              Sign in to leave a comment.
            </div>
          )}

          {/* Comments List */}
          <div className="flex flex-col gap-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border border-white/10 rounded-lg p-4 bg-[#2b2b2b]"
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => router.push(`/u/${comment.username}`)}
                    className="text-sm font-medium hover:underline"
                  >
                    @{comment.username}
                  </button>
                  <div className="text-xs text-white/60">
                    {new Date(comment.created_at).toLocaleString()}
                  </div>
                </div>
                <p className="text-white/80 text-sm">{comment.content}</p>
                {currentUserId === comment.user_id && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-white/60 text-sm">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
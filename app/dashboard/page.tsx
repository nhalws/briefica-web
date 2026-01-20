"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";
import ProfilePicture from "../components/ProfilePicture";
import SchoolCommunity from "../components/SchoolCommunity";
import LiveChat from "../components/LiveChat";
import Footer from "../components/Footer";
import ConfirmedBanner from "./Confirmedbanner";
import { BBCounter } from "../components/BBCounter";

type CommentPreview = {
  id: string;
  content: string;
  username: string;
  created_at: string;
};

type ArtifactRow = {
  id: string;
  owner_id: string;
  type: "bset" | "bmod" | "tbank";
  title: string;
  description: string | null;
  created_at: string;
  storage_key: string;
  has_top_grade_badge?: boolean;
  is_professor_verified?: boolean;
};

type Friend = {
  user_id: string;
  username: string;
};

type UserProfile = {
  username: string;
  law_school: string | null;
  upload_count: number;
  friend_count: number;
  pending_requests: number;
  profile_picture_url: string | null;
  total_likes: number;
  total_downloads: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [rows, setRows] = useState<ArtifactRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<ArtifactRow[]>([]);
  const [usernamesByOwner, setUsernamesByOwner] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [commentPreviews, setCommentPreviews] = useState<Record<string, CommentPreview[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "bset" | "bmod" | "tbank">("all");
  const [msg, setMsg] = useState<string | null>(null);
  const [goldilexAccess, setGoldilexAccess] = useState<boolean>(false);

  // SET PAGE TITLE
  useEffect(() => {
    document.title = "briefica web (b-web)";
  }, []);

  useEffect(() => {
    async function guard() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, username, law_school, profile_picture_url")
        .eq("user_id", data.user.id)
        .single();

      if (profile) {
        setCurrentUserId(profile.user_id);

        await loadUserProfile(
          profile.user_id,
          profile.username,
          profile.law_school,
          profile.profile_picture_url
        );
        await loadFriends(profile.user_id);
      }
    }
    guard();
  }, [router]);

  async function loadUserProfile(
    userId: string,
    username: string,
    lawSchool: string | null,
    profilePictureUrl: string | null
  ) {
    const { data: userArtifacts, count: uploadCount } = await supabase
      .from("artifacts")
      .select("id", { count: "exact" })
      .eq("owner_id", userId);

    const artifactIds = (userArtifacts ?? []).map((a: any) => a.id);

    let totalLikes = 0;
    let totalDownloads = 0;
    if (artifactIds.length > 0) {
      const { count: likesCount } = await supabase
        .from("artifact_likes")
        .select("id", { count: "exact", head: true })
        .in("artifact_id", artifactIds);
      totalLikes = likesCount ?? 0;

      const { count: downloadsCount } = await supabase
        .from("artifact_downloads")
        .select("id", { count: "exact", head: true })
        .in("artifact_id", artifactIds);
      totalDownloads = downloadsCount ?? 0;
    }

    const { count: friendCount } = await supabase
      .from("friend_requests")
      .select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq("status", "accepted");

    const { count: pendingCount } = await supabase
      .from("friend_requests")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("status", "pending");

    setUserProfile({
      username,
      law_school: lawSchool,
      upload_count: uploadCount ?? 0,
      friend_count: friendCount ?? 0,
      pending_requests: pendingCount ?? 0,
      profile_picture_url: profilePictureUrl,
      total_likes: totalLikes,
      total_downloads: totalDownloads,
    });
  }

  async function loadFriends(userId: string) {
    const { data: requests } = await supabase
      .from("friend_requests")
      .select(`
        requester_id,
        recipient_id,
        requester:profiles!friend_requests_requester_id_fkey(user_id, username),
        recipient:profiles!friend_requests_recipient_id_fkey(user_id, username)
      `)
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq("status", "accepted");

    if (requests) {
      const friendsList: Friend[] = [];

      requests.forEach((req: any) => {
        if (req.requester_id === userId) {
          const recipientProfile = req.recipient as any;
          if (recipientProfile) {
            friendsList.push({
              user_id: recipientProfile.user_id,
              username: recipientProfile.username,
            });
          }
        } else {
          const requesterProfile = req.requester as any;
          if (requesterProfile) {
            friendsList.push({
              user_id: requesterProfile.user_id,
              username: requesterProfile.username,
            });
          }
        }
      });

      setFriends(friendsList);
    }
  }

  useEffect(() => {
    async function load() {
      setMsg(null);

      const { data, error } = await supabase
        .from("artifacts")
        .select("id, owner_id, type, title, description, created_at, storage_key, has_top_grade_badge, is_professor_verified")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        setMsg(error.message);
        return;
      }

      setRows(data ?? []);
      setFilteredRows(data ?? []);

      const ownerIds = Array.from(new Set((data ?? []).map((r) => r.owner_id)));
      if (ownerIds.length) {
        const { data: ps } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", ownerIds);

        const map: Record<string, string> = {};
        (ps ?? []).forEach((p: any) => (map[p.user_id] = p.username));
        setUsernamesByOwner(map);
      }

      const artifactIds = (data ?? []).map((r) => r.id);
      if (artifactIds.length > 0) {
        await loadLikesAndDownloads(artifactIds);
        await loadCommentPreviews(artifactIds);
      }
    }

    load();
  }, []);

  async function loadLikesAndDownloads(artifactIds: string[]) {
    // Load like counts
    const { data: likes } = await supabase
      .from("artifact_likes")
      .select("artifact_id")
      .in("artifact_id", artifactIds);

    const likesMap: Record<string, number> = {};
    (likes ?? []).forEach((like) => {
      likesMap[like.artifact_id] = (likesMap[like.artifact_id] || 0) + 1;
    });
    setLikeCounts(likesMap);

    // Load download counts from artifacts table (now tracking there)
    const { data: artifacts } = await supabase
      .from("artifacts")
      .select("id, downloads_count")
      .in("id", artifactIds);

    const downloadsMap: Record<string, number> = {};
    (artifacts ?? []).forEach((artifact: any) => {
      downloadsMap[artifact.id] = artifact.downloads_count || 0;
    });
    setDownloadCounts(downloadsMap);

    // Load current user's likes
    if (currentUserId) {
      const { data: userLikesData } = await supabase
        .from("artifact_likes")
        .select("artifact_id")
        .eq("user_id", currentUserId)
        .in("artifact_id", artifactIds);

      setUserLikes(new Set((userLikesData ?? []).map((l) => l.artifact_id)));
    }
  }

  useEffect(() => {
    let filtered = rows;

    if (typeFilter !== "all") {
      filtered = filtered.filter((r) => r.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          usernamesByOwner[r.owner_id]?.toLowerCase().includes(query)
      );
    }

    setFilteredRows(filtered);
  }, [searchQuery, typeFilter, rows, usernamesByOwner]);

  useEffect(() => {
    async function checkGoldilexAccess() {
      if (!currentUserId) return;

      const { data } = await supabase
        .from("goldilex_access")
        .select("approved")
        .eq("user_id", currentUserId)
        .single();

      setGoldilexAccess(data?.approved ?? false);
    }

    if (currentUserId) {
      checkGoldilexAccess();
    }
  }, [currentUserId]);

  async function toggleLike(artifactId: string) {
    if (!currentUserId) return;

    const isLiked = userLikes.has(artifactId);

    if (isLiked) {
      await supabase
        .from("artifact_likes")
        .delete()
        .eq("artifact_id", artifactId)
        .eq("user_id", currentUserId);

      setUserLikes((prev) => {
        const next = new Set(prev);
        next.delete(artifactId);
        return next;
      });

      setLikeCounts((prev) => ({
        ...prev,
        [artifactId]: Math.max(0, (prev[artifactId] || 0) - 1),
      }));
    } else {
      await supabase.from("artifact_likes").insert({
        artifact_id: artifactId,
        user_id: currentUserId,
      });

      setUserLikes((prev) => new Set(prev).add(artifactId));

      setLikeCounts((prev) => ({
        ...prev,
        [artifactId]: (prev[artifactId] || 0) + 1,
      }));
    }
  }

  async function handleDownload(artifactId: string, storageKey: string, fileName: string, artifactType: string) {
    if (!currentUserId) return;

    // Check if artifact is .bset (costs 1 BB) or Free-B (.bmod/.tbank = free)
    const isBset = artifactType === "bset";

    if (isBset) {
      // Use the new API route that checks BBs
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert("Please sign in to download");
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
            // Show error with upgrade options
            const shouldUpgrade = confirm(
              `${data.error}\n\nOptions:\n- Buy BBs ($5 each)\n- Upgrade to Gold ($15/month unlimited)\n\nWould you like to view pricing?`
            );
            if (shouldUpgrade) {
              router.push('/pricing');
            }
          } else {
            alert(data.error || 'Failed to download');
          }
          return;
        }

        // Download the file using signed URL from API
        const link = document.createElement("a");
        link.href = data.download_url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Update local download count
        setDownloadCounts((prev) => ({
          ...prev,
          [artifactId]: (prev[artifactId] || 0) + 1,
        }));

      } catch (e) {
        console.error("Download failed:", e);
        alert("Download failed. Please try again.");
      }
    } else {
      // Free-B files (.bmod, .tbank) - download without BB check
      try {
        // Record download in database (but don't consume BB)
        await supabase.from("artifact_downloads").insert({
          artifact_id: artifactId,
          user_id: currentUserId,
        });

        // Get signed URL and download
        const { data, error } = await supabase.storage.from("artifacts").createSignedUrl(storageKey, 300);

        if (error || !data?.signedUrl) {
          console.error("Failed to generate download link");
          return;
        }

        const response = await fetch(data.signedUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Update local count
        setDownloadCounts((prev) => ({
          ...prev,
          [artifactId]: (prev[artifactId] || 0) + 1,
        }));
      } catch (e) {
        console.error("Download failed:", e);
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function handleProfilePictureUpdate(newUrl: string) {
    setUserProfile((prev) => (prev ? { ...prev, profile_picture_url: newUrl } : null));
  }

  function badge(t: ArtifactRow["type"]) {
    return t === "bset" ? ".bset" : t === "bmod" ? ".bmod" : ".tbank";
  }

  async function loadCommentPreviews(artifactIds: string[]) {
    const { data } = await supabase
      .from("artifact_comments")
      .select(`
        id,
        artifact_id,
        content,
        created_at,
        profiles!artifact_comments_user_id_fkey(username)
      `)
      .in("artifact_id", artifactIds)
      .order("created_at", { ascending: false });

    if (!data) return;

    const grouped: Record<string, CommentPreview[]> = {};
    data.forEach((c: any) => {
      const arr = grouped[c.artifact_id] || [];
      if (arr.length < 3) {
        arr.push({
          id: c.id,
          content: c.content,
          username: c.profiles?.username ?? "unknown",
          created_at: c.created_at,
        });
        grouped[c.artifact_id] = arr;
      }
    });
    setCommentPreviews(grouped);
  }

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Confirmed banner (only reads URL params inside the child component) */}
        <Suspense fallback={null}>
          <ConfirmedBanner />
        </Suspense>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Image src="/logo_6.png" alt="briefica" width={160} height={48} className="object-contain" />
            <div className="w-14 h-14 text-white/90">
              <svg viewBox="0 0 64 64" className="w-full h-full">
                <g transform="skewX(-8) skewY(5)">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 32 32"
                    to="360 32 32"
                    dur="32s"
                    repeatCount="indefinite"
                  />
                  <circle cx="32" cy="32" r="5" fill="#66b2ff" stroke="#e6eaf0" strokeWidth="1.5" />
                  <defs>
                    <circle id="orbit-node" r="4" fill="#66b2ff" stroke="#e6eaf0" strokeWidth="1.5" />
                  </defs>
                  {[
                    { angle: 0, dur: "18s", sway: "8s" },
                    { angle: 60, dur: "20s", sway: "7s" },
                    { angle: 120, dur: "22s", sway: "9s" },
                    { angle: 180, dur: "19s", sway: "8.5s" },
                    { angle: 240, dur: "23s", sway: "7.5s" },
                    { angle: 300, dur: "21s", sway: "9.5s" },
                  ].map(({ angle, dur, sway }) => (
                    <g key={angle} transform={`rotate(${angle} 32 32)`}>
                      <g>
                        <line x1="32" y1="32" x2="32" y2="8" stroke="#e6eaf0" strokeWidth="1.25">
                          <animate attributeName="y2" dur={sway} repeatCount="indefinite" keyTimes="0;0.5;1" values="8;6;8" />
                        </line>
                        <use href="#orbit-node" x="32" y="8">
                          <animate attributeName="y" dur={sway} repeatCount="indefinite" keyTimes="0;0.5;1" values="8;6;8" />
                        </use>
                      </g>
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        dur={dur}
                        repeatCount="indefinite"
                        keyTimes="0;0.33;0.66;1"
                        values={`${angle} 32 32; ${angle + 360} 32 32; ${angle - 360} 32 32; ${angle + 360} 32 32`}
                      />
                    </g>
                  ))}
                </g>
              </svg>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/upload")}
              className="bg-white text-black rounded-lg py-2 px-4 font-medium hover:bg-white/90 transition-colors"
            >
              upload
            </button>
            <button
              onClick={() => router.push("/downloads")}
              className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/15 transition-colors"
            >
              download
            </button>
            <button
              onClick={() => router.push("/faq")}
              className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/15 transition-colors"
            >
              help
            </button>
            <button
              onClick={() => {
                if (goldilexAccess) {
                  window.open("https://goldilex.briefica.com", "_blank", "noopener,noreferrer");
                }
              }}
              disabled={!goldilexAccess}
              className={`rounded-lg py-2 px-4 font-medium transition-colors ${
                goldilexAccess 
                  ? 'hover:opacity-90 cursor-pointer' 
                  : 'cursor-not-allowed opacity-50'
              }`}
              style={{ 
                backgroundColor: goldilexAccess ? '#BF9B30' : '#4a4a4a',
                color: 'white'
              }}
            >
              open Goldilex
            </button>
            <button
              onClick={handleLogout}
              className="border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors"
            >
              logout
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="w-72 flex-shrink-0 space-y-4">
            {/* COMBINED PROFILE + BB WIDGET */}
            {userProfile && currentUserId && (
              <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4">
                {/* Profile Section with Stats on Same Row */}
                <div className="flex items-start gap-3 mb-3 pb-3 border-b border-white/10">
                  <ProfilePicture
                    userId={currentUserId}
                    currentPictureUrl={userProfile.profile_picture_url}
                    username={userProfile.username}
                    size={60}
                    editable={true}
                    onUpdate={handleProfilePictureUpdate}
                  />
                  <div className="flex-1">
                    <button
                      onClick={() => router.push(`/u/${userProfile.username}`)}
                      className="text-lg font-semibold hover:text-white/80 transition-colors block mb-1"
                    >
                      {userProfile.username}
                    </button>
                    {userProfile.law_school && (
                      <p className="text-xs text-white/60 mb-2">{userProfile.law_school}</p>
                    )}
                    {/* Stats moved here beside profile */}
                    <div className="flex gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-white/60">Uploads:</span>
                        <span className="font-medium">{userProfile.upload_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-white/60">Likes:</span>
                        <span className="font-medium">{userProfile.total_likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-white/60">Friends:</span>
                        <span className="font-medium">{userProfile.friend_count}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BB Counter Component - NO BOTTOM BORDER */}
                <BBCounter />

                {/* Friend Requests Button */}
                {userProfile.pending_requests > 0 && (
                  <button
                    onClick={() => router.push("/friends")}
                    className="mt-3 w-full rounded-lg py-2 px-4 font-medium transition-colors flex items-center justify-center gap-2 text-white hover:opacity-90"
                    style={{ backgroundColor: "#66b2ff" }}
                  >
                    Add Friends
                    <span className="bg-white rounded-full px-2 py-0.5 text-xs font-bold" style={{ color: "#66b2ff" }}>
                      {userProfile.pending_requests}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* SCHOOL COMMUNITY WIDGET */}
            {userProfile && currentUserId && (
              <SchoolCommunity userSchool={userProfile.law_school} currentUserId={currentUserId} />
            )}

            {/* LIVE CHAT WIDGET */}
            {userProfile && currentUserId && (
              <LiveChat currentUserId={currentUserId} username={userProfile.username} userSchool={userProfile.law_school} />
            )}
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1 max-w-4xl">
            {/* Search and Filter */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by title, description, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-[#1e1e1e] border border-white/20 focus:border-white/40 focus:outline-none"
              />

              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    typeFilter === "all" 
                      ? "bg-white/20 text-white border-white/40" 
                      : "bg-[#1e1e1e] border-white/20 hover:bg-white/5"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTypeFilter("bset")}
                  className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                    typeFilter === "bset" 
                      ? "bg-white/20 text-white border-white/40" 
                      : "bg-[#1e1e1e] border-white/20 hover:bg-white/5"
                  }`}
                >
                  <Image src="/bset.png" alt="bset" width={20} height={20} />
                  .bset
                </button>
                <button
                  onClick={() => setTypeFilter("bmod")}
                  className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                    typeFilter === "bmod" 
                      ? "bg-white/20 text-white border-white/40" 
                      : "bg-[#1e1e1e] border-white/20 hover:bg-white/5"
                  }`}
                >
                  <Image src="/bmod.png" alt="bmod" width={20} height={20} />
                  .bmod
                </button>
                <button
                  onClick={() => setTypeFilter("tbank")}
                  className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                    typeFilter === "tbank" 
                      ? "bg-white/20 text-white border-white/40" 
                      : "bg-[#1e1e1e] border-white/20 hover:bg-white/5"
                  }`}
                >
                  <Image src="/b_blank.png" alt="tbank" width={20} height={20} />
                  .tbank
                </button>
              </div>
            </div>

            {msg && <p className="text-sm text-white/70 mt-3">{msg}</p>}

            <div className="mt-6 flex flex-col gap-3">
              {filteredRows.map((r) => (
                <div key={r.id} className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4 flex flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-white/60 flex items-center gap-2">
                      <span className="inline-block px-2 py-1 rounded bg-white/10 border border-white/10">{badge(r.type)}</span>
                      <span>{new Date(r.created_at).toLocaleString()}</span>
                      
                      {/* Show badges */}
                      {r.has_top_grade_badge && (
                        <span className="px-2 py-0.5 bg-yellow-900/30 border border-yellow-600 rounded text-yellow-500 text-xs">
                          🏆 Top Grade
                        </span>
                      )}
                      {r.is_professor_verified && (
                        <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-600 rounded text-blue-500 text-xs">
                          👨‍🏫 Professor
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => router.push(`/u/${usernamesByOwner[r.owner_id]}`)}
                      className="text-xs text-white/70 hover:text-white hover:underline"
                    >
                      @{usernamesByOwner[r.owner_id] ?? "unknown"}
                    </button>
                  </div>

                  <button onClick={() => router.push(`/a/${r.id}`)} className="text-left w-full flex-1">
                    <div className="mt-2 font-medium hover:text-white/80 transition-colors line-clamp-2">{r.title}</div>
                    {r.description && <div className="text-sm text-white/70 mt-1 line-clamp-2">{r.description}</div>}
                  </button>

                  {/* Comments preview */}
                  {commentPreviews[r.id] && commentPreviews[r.id].length > 0 && (
                    <div className="mt-3 space-y-2 text-xs text-white/70">
                      {commentPreviews[r.id].map((c: CommentPreview) => (
                        <div key={c.id} className="border border-white/10 rounded-lg p-2 bg-[#2b2b2b] line-clamp-2">
                          <span className="text-white">@{c.username}</span>: {c.content}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Like and Download buttons */}
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <button
                      onClick={() => toggleLike(r.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        userLikes.has(r.id) ? "text-red-400" : "text-white/60 hover:text-white/80"
                      }`}
                    >
                      <svg className="w-5 h-5" fill={userLikes.has(r.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span>{likeCounts[r.id] || 0}</span>
                    </button>

                    <button
                      onClick={() => handleDownload(r.id, r.storage_key, `${r.title}.${r.type}`, r.type)}
                      className="flex items-center gap-1.5 transition-colors text-white/60 hover:text-white/80"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                        />
                      </svg>
                      <span>{downloadCounts[r.id] || 0}</span>
                      {r.type === "bset" && <span className="text-xs text-white/40">(1 BB)</span>}
                      {r.type !== "bset" && <span className="text-xs text-green-400">(Free-B)</span>}
                    </button>
                  </div>
                </div>
              ))}

              {!filteredRows.length && rows.length > 0 && (
                <div className="text-white/60 border border-white/10 bg-[#1e1e1e] rounded-2xl p-6">
                  No results found for your search.
                </div>
              )}

              {!rows.length && (
                <div className="text-white/60 border border-white/10 bg-[#1e1e1e] rounded-2xl p-6">
                  No public uploads yet. Upload your first artifact.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </main>
  );
}
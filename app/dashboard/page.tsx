"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";
import { getLawSchoolLogo } from "../lib/lawschools";
import ProfilePicture from "../components/ProfilePicture";

type ArtifactRow = {
  id: string;
  owner_id: string;
  type: "bset" | "bmod" | "tbank";
  title: string;
  description: string | null;
  created_at: string;
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
};

export default function DashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ArtifactRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<ArtifactRow[]>([]);
  const [usernamesByOwner, setUsernamesByOwner] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userShares, setUserShares] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "bset" | "bmod" | "tbank">("all");
  const [msg, setMsg] = useState<string | null>(null);
  const userLawSchoolLogo = userProfile?.law_school ? getLawSchoolLogo(userProfile.law_school) : undefined;

  // SET PAGE TITLE
  useEffect(() => {
    document.title = 'Dashboard - briefica';
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
        
        // Load user stats
        await loadUserProfile(profile.user_id, profile.username, profile.law_school, profile.profile_picture_url);
        
        // Load friends
        await loadFriends(profile.user_id);
      }
    }
    guard();
  }, [router]);

  async function loadUserProfile(userId: string, username: string, lawSchool: string | null, profilePictureUrl: string | null) {
    // Get upload count
    const { count: uploadCount } = await supabase
      .from("artifacts")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);

    // Get friend count (accepted requests)
    const { count: friendCount } = await supabase
      .from("friend_requests")
      .select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq("status", "accepted");

    // Get pending requests count
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
    });
  }

  async function loadFriends(userId: string) {
    // Get all accepted friend requests
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
          // I sent the request, so the friend is the recipient
          const recipientProfile = req.recipient as any;
          if (recipientProfile) {
            friendsList.push({
              user_id: recipientProfile.user_id,
              username: recipientProfile.username,
            });
          }
        } else {
          // They sent the request, so the friend is the requester
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
        .select("id, owner_id, type, title, description, created_at")
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

      // Load likes and shares counts
      const artifactIds = (data ?? []).map((r) => r.id);
      if (artifactIds.length > 0) {
        await loadLikesAndShares(artifactIds);
      }
    }

    load();
  }, []);

  async function loadLikesAndShares(artifactIds: string[]) {
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

    // Load share counts
    const { data: shares } = await supabase
      .from("artifact_shares")
      .select("artifact_id")
      .in("artifact_id", artifactIds);

    const sharesMap: Record<string, number> = {};
    (shares ?? []).forEach((share) => {
      sharesMap[share.artifact_id] = (sharesMap[share.artifact_id] || 0) + 1;
    });
    setShareCounts(sharesMap);

    // Load current user's likes and shares
    if (currentUserId) {
      const { data: userLikesData } = await supabase
        .from("artifact_likes")
        .select("artifact_id")
        .eq("user_id", currentUserId)
        .in("artifact_id", artifactIds);

      setUserLikes(new Set((userLikesData ?? []).map((l) => l.artifact_id)));

      const { data: userSharesData } = await supabase
        .from("artifact_shares")
        .select("artifact_id")
        .eq("user_id", currentUserId)
        .in("artifact_id", artifactIds);

      setUserShares(new Set((userSharesData ?? []).map((s) => s.artifact_id)));
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

  async function toggleShare(artifactId: string) {
    if (!currentUserId) return;

    const isShared = userShares.has(artifactId);

    if (isShared) {
      await supabase
        .from("artifact_shares")
        .delete()
        .eq("artifact_id", artifactId)
        .eq("user_id", currentUserId);

      setUserShares((prev) => {
        const next = new Set(prev);
        next.delete(artifactId);
        return next;
      });

      setShareCounts((prev) => ({
        ...prev,
        [artifactId]: Math.max(0, (prev[artifactId] || 0) - 1),
      }));
    } else {
      await supabase.from("artifact_shares").insert({
        artifact_id: artifactId,
        user_id: currentUserId,
      });

      setUserShares((prev) => new Set(prev).add(artifactId));

      setShareCounts((prev) => ({
        ...prev,
        [artifactId]: (prev[artifactId] || 0) + 1,
      }));
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function handleProfilePictureUpdate(newUrl: string) {
    setUserProfile(prev => prev ? { ...prev, profile_picture_url: newUrl } : null);
  }

  function badge(t: ArtifactRow["type"]) {
    return t === "bset" ? ".bset" : t === "bmod" ? ".bmod" : ".tbank";
  }

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_6.png"
              alt="briefica"
              width={160}
              height={48}
              className="object-contain"
            />
            <div className="w-14 h-14 text-white/90">
              <svg
                viewBox="0 0 64 64"
                className="w-full h-full"
              >
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
                          <animate
                            attributeName="y2"
                            dur={sway}
                            repeatCount="indefinite"
                            keyTimes="0;0.5;1"
                            values="8;6;8"
                          />
                        </line>
                        <use href="#orbit-node" x="32" y="8">
                          <animate
                            attributeName="y"
                            dur={sway}
                            repeatCount="indefinite"
                            keyTimes="0;0.5;1"
                            values="8;6;8"
                          />
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
              Upload
            </button>
            <button
              onClick={() => router.push("/downloads")}
              className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/15 transition-colors"
            >
              download briefica
            </button>
            <button
              onClick={handleLogout}
              className="border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="w-72 flex-shrink-0">
            {/* PROFILE WIDGET */}
            {userProfile && currentUserId && (
              <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
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
                      className="text-xl font-semibold hover:text-white/80 transition-colors"
                    >
                      @{userProfile.username}
                    </button>
                    {userProfile.law_school && (
                      userLawSchoolLogo ? (
                        <div className="mt-1">
                          <Image
                            src={userLawSchoolLogo}
                            alt={`${userProfile.law_school} logo`}
                            width={64}
                            height={64}
                            className="rounded"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-white/60 mt-1">{userProfile.law_school}</div>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-white/60">Uploads: </span>
                    <span className="font-medium">{userProfile.upload_count}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Friends: </span>
                    <span className="font-medium">{userProfile.friend_count}</span>
                  </div>
                </div>

                {userProfile.pending_requests > 0 && (
                  <button
                    onClick={() => router.push("/friends")}
                    className="mt-4 w-full rounded-lg py-2 px-4 font-medium transition-colors flex items-center justify-center gap-2 text-white hover:opacity-90"
                    style={{ backgroundColor: '#66b2ff' }}
                  >
                    Add Friends
                    <span className="bg-white rounded-full px-2 py-0.5 text-xs font-bold" style={{ color: '#66b2ff' }}>
                      {userProfile.pending_requests}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* FRIENDS LIST */}
            <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4 sticky top-6">
              <h2 className="font-semibold mb-4">Friends</h2>
              
              {friends.length === 0 ? (
                <p className="text-sm text-white/60">
                  You don't have any friends yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.user_id}
                      onClick={() => router.push(`/u/${friend.username}`)}
                      className="text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
                    >
                      @{friend.username}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1 max-w-3xl">

            {/* Search and Filter */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by title, description, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-[#1e1e1e] border border-white/20 focus:border-white/40 focus:outline-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    typeFilter === "all"
                      ? "bg-white text-black border-white"
                      : "bg-[#1e1e1e] border-white/20 hover:bg-white/5"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTypeFilter("bset")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    typeFilter === "bset"
                      ? "bg-white text-black border-white"
                      : "bg-[#1e1e1e] border-white/20 hover:bg-white/5"
                  }`}
                >
                  .bset
                </button>
                <button
                  onClick={() => setTypeFilter("bmod")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    typeFilter === "bmod"
                      ? "bg-white text-black border-white"
                      : "bg-[#1e1e1e] border-white/20 hover:bg-white/5"
                  }`}
                >
                  .bmod
                </button>
                <button
                  onClick={() => setTypeFilter("tbank")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    typeFilter === "tbank"
                      ? "bg-white text-black border-white"
                      : "bg-[#1e1e1e] border-white/20 hover:bg-white/5"
                  }`}
                >
                  .tbank
                </button>
              </div>
            </div>

            {msg && <p className="text-sm text-white/70 mt-3">{msg}</p>}

            <div className="mt-6 flex flex-col gap-3">
              {filteredRows.map((r) => (
                <div
                  key={r.id}
                  className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-white/60">
                      <span className="inline-block px-2 py-1 rounded bg-white/10 border border-white/10">
                        {badge(r.type)}
                      </span>
                      <span className="ml-3">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => router.push(`/u/${usernamesByOwner[r.owner_id]}`)}
                      className="text-xs text-white/70 hover:text-white hover:underline"
                    >
                      @{usernamesByOwner[r.owner_id] ?? "unknown"}
                    </button>
                  </div>

                  <button
                    onClick={() => router.push(`/a/${r.id}`)}
                    className="text-left w-full"
                  >
                    <div className="mt-2 font-medium hover:text-white/80 transition-colors">
                      {r.title}
                    </div>
                    {r.description && (
                      <div className="text-sm text-white/70 mt-1 line-clamp-2">
                        {r.description}
                      </div>
                    )}
                  </button>

                  {/* Like and Share buttons */}
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <button
                      onClick={() => toggleLike(r.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        userLikes.has(r.id)
                          ? "text-red-400"
                          : "text-white/60 hover:text-white/80"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill={userLikes.has(r.id) ? "currentColor" : "none"}
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
                      <span>{likeCounts[r.id] || 0}</span>
                    </button>

                    <button
                      onClick={() => toggleShare(r.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        userShares.has(r.id)
                          ? ""
                          : "text-white/60 hover:text-white/80"
                      }`}
                      style={userShares.has(r.id) ? { color: '#66b2ff' } : {}}
                    >
                      <svg
                        className="w-5 h-5"
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
                      <span>{shareCounts[r.id] || 0}</span>
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
      </div>
    </main>
  );
}

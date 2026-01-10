"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import SubjectPreferences from "../../components/SubjectPreferences";
import LiveChat from "../../components/LiveChat";

interface SchoolMember {
  user_id: string;
  username: string;
  profile_picture_url: string | null;
  upload_count: number;
}

interface TopUser {
  user_id: string;
  username: string;
  profile_picture_url: string | null;
  total_likes: number;
}

interface Artifact {
  id: string;
  owner_id: string;
  type: "bset" | "bmod" | "tbank";
  title: string;
  description: string | null;
  created_at: string;
  owner_username?: string;
  like_count?: number;
  share_count?: number;
}

export default function SchoolDirectoryPage() {
  const router = useRouter();
  const params = useParams();
  
  const rawSchoolName = params?.schoolName;
  const schoolName = typeof rawSchoolName === 'string' 
    ? decodeURIComponent(rawSchoolName) 
    : Array.isArray(rawSchoolName) 
    ? decodeURIComponent(rawSchoolName[0]) 
    : "";

  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [topSets, setTopSets] = useState<Artifact[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [filteredArtifacts, setFilteredArtifacts] = useState<Artifact[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "bset" | "bmod" | "tbank">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schoolName) {
      document.title = `${schoolName} - briefica`;
    }
  }, [schoolName]);

  useEffect(() => {
    let mounted = true;

    async function loadSchoolData() {
      try {
        if (!schoolName) {
          if (mounted) {
            setError("No school name provided");
            setLoading(false);
          }
          return;
        }

        // Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          if (mounted) {
            setError(userError.message);
            setLoading(false);
          }
          return;
        }
        
        if (mounted && userData.user) {
          setCurrentUserId(userData.user.id);
          
          // Get current user's username
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", userData.user.id)
            .single();
          
          if (profile) {
            setCurrentUsername(profile.username);
          }
        }

        // Get all profiles from this school
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, username, profile_picture_url, law_school")
          .eq("law_school", schoolName)
          .order("username", { ascending: true });

        if (!profilesData) {
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        const schoolUserIds = profilesData.map(p => p.user_id);

        // Load members with upload counts
        const membersWithCounts = await Promise.all(
          profilesData.map(async (profile) => {
            const { count } = await supabase
              .from("artifacts")
              .select("id", { count: "exact", head: true })
              .eq("owner_id", profile.user_id)
              .eq("visibility", "public");

            return {
              user_id: profile.user_id,
              username: profile.username,
              profile_picture_url: profile.profile_picture_url,
              upload_count: count ?? 0,
            };
          })
        );

        if (mounted) {
          setMembers(membersWithCounts);
        }

        // Load all public artifacts from school members
        const { data: artifactsData } = await supabase
          .from("artifacts")
          .select("*")
          .in("owner_id", schoolUserIds)
          .eq("visibility", "public")
          .order("created_at", { ascending: false });

        if (artifactsData) {
          // Add owner usernames
          const artifactsWithOwners = artifactsData.map(artifact => ({
            ...artifact,
            owner_username: profilesData.find(p => p.user_id === artifact.owner_id)?.username || "unknown",
          }));

          // Get like counts for all artifacts
          const artifactIds = artifactsData.map(a => a.id);
          const { data: likes } = await supabase
            .from("artifact_likes")
            .select("artifact_id")
            .in("artifact_id", artifactIds);

          const { data: shares } = await supabase
            .from("artifact_shares")
            .select("artifact_id")
            .in("artifact_id", artifactIds);

          const likeCounts: Record<string, number> = {};
          (likes ?? []).forEach((like) => {
            likeCounts[like.artifact_id] = (likeCounts[like.artifact_id] || 0) + 1;
          });

          const shareCounts: Record<string, number> = {};
          (shares ?? []).forEach((share) => {
            shareCounts[share.artifact_id] = (shareCounts[share.artifact_id] || 0) + 1;
          });

          const artifactsWithCounts = artifactsWithOwners.map(artifact => ({
            ...artifact,
            like_count: likeCounts[artifact.id] || 0,
            share_count: shareCounts[artifact.id] || 0,
          }));

          if (mounted) {
            setArtifacts(artifactsWithCounts);
            setFilteredArtifacts(artifactsWithCounts);

            // Get top 10 .bset files by likes
            const topBsets = artifactsWithCounts
              .filter(a => a.type === "bset")
              .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
              .slice(0, 10);
            setTopSets(topBsets);
          }
        }

        // Calculate top users by total likes
        const userLikes: Record<string, number> = {};
        
        for (const userId of schoolUserIds) {
          const { data: userArtifacts } = await supabase
            .from("artifacts")
            .select("id")
            .eq("owner_id", userId)
            .eq("visibility", "public");

          if (userArtifacts && userArtifacts.length > 0) {
            const artifactIds = userArtifacts.map(a => a.id);
            const { count } = await supabase
              .from("artifact_likes")
              .select("id", { count: "exact", head: true })
              .in("artifact_id", artifactIds);

            userLikes[userId] = count || 0;
          }
        }

        const topUsersData = profilesData
          .map(profile => ({
            user_id: profile.user_id,
            username: profile.username,
            profile_picture_url: profile.profile_picture_url,
            total_likes: userLikes[profile.user_id] || 0,
          }))
          .filter(u => u.total_likes > 0)
          .sort((a, b) => b.total_likes - a.total_likes)
          .slice(0, 10);

        if (mounted) {
          setTopUsers(topUsersData);
          setLoading(false);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        if (mounted) {
          setError(errorMessage);
          setLoading(false);
        }
      }
    }

    if (schoolName) {
      loadSchoolData();
    } else {
      setError("No school name in URL");
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [schoolName]);

  // Filter artifacts when search or type changes
  useEffect(() => {
    let filtered = artifacts;

    if (typeFilter !== "all") {
      filtered = filtered.filter(a => a.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query) ||
        a.owner_username?.toLowerCase().includes(query)
      );
    }

    setFilteredArtifacts(filtered);
  }, [searchQuery, typeFilter, artifacts]);

  function badge(type: Artifact["type"]) {
    return type === "bset" ? ".bset" : type === "bmod" ? ".bmod" : ".tbank";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-white/70">Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white/70 hover:text-white flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to dashboard
          </button>
          <p className="text-red-400">Error: {error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white/70 hover:text-white flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to dashboard
          </button>

          <Image
            src="/logo_6.png"
            alt="briefica"
            width={140}
            height={42}
            className="object-contain"
          />
        </div>

        {/* School Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{schoolName}</h1>
          <p className="text-white/70">{members.length} member{members.length !== 1 ? 's' : ''} · {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Member Directory & Subject Prefs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subject Preferences */}
            {currentUserId && (
              <SubjectPreferences
                userId={currentUserId}
                userSchool={schoolName}
                onUpdate={() => window.location.reload()}
              />
            )}

            {/* Member Directory Preview */}
            <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">Members</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {members.slice(0, 6).map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => router.push(`/u/${member.username}`)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white border-2 border-white flex-shrink-0"
                      style={{ backgroundColor: '#66b2ff' }}
                    >
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">@{member.username}</div>
                      <div className="text-sm text-white/60">
                        {member.upload_count} upload{member.upload_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {members.length > 6 && (
                <p className="text-sm text-white/60 mt-4 text-center">
                  and {members.length - 6} more member{members.length - 6 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Top Sets & Top Users */}
          <div className="space-y-6">
            {/* Top Rated Sets */}
            <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Top Rated Sets</h2>
              {topSets.length === 0 ? (
                <p className="text-sm text-white/60">No .bset files yet</p>
              ) : (
                <div className="space-y-3">
                  {topSets.map((artifact, index) => (
                    <button
                      key={artifact.id}
                      onClick={() => router.push(`/a/${artifact.id}`)}
                      className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-white/40 text-sm font-bold">#{index + 1}</span>
                        <div className="flex-1">
                          <div className="font-medium line-clamp-1">{artifact.title}</div>
                          <div className="text-xs text-white/60">@{artifact.owner_username}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>❤️ {artifact.like_count || 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Top Rated Users */}
            <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Top Rated Users</h2>
              {topUsers.length === 0 ? (
                <p className="text-sm text-white/60">No likes yet</p>
              ) : (
                <div className="space-y-3">
                  {topUsers.map((user, index) => (
                    <button
                      key={user.user_id}
                      onClick={() => router.push(`/u/${user.username}`)}
                      className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <span className="text-white/40 text-sm font-bold w-6">#{index + 1}</span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white border border-white flex-shrink-0"
                        style={{ backgroundColor: '#66b2ff' }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">@{user.username}</div>
                        <div className="text-xs text-white/60">❤️ {user.total_likes} likes</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">All Artifacts</h2>
          
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artifacts by title, description, or username..."
              className="w-full px-4 py-3 rounded-lg bg-[#1e1e1e] border border-white/20 focus:border-white/40 focus:outline-none"
            />
          </div>

          {/* Type Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                typeFilter === "all"
                  ? "bg-white text-black border-white"
                  : "border-white/20 hover:bg-white/5"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter("bset")}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                typeFilter === "bset"
                  ? "bg-white text-black border-white"
                  : "border-white/20 hover:bg-white/5"
              }`}
            >
              .bset
            </button>
            <button
              onClick={() => setTypeFilter("bmod")}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                typeFilter === "bmod"
                  ? "bg-white text-black border-white"
                  : "border-white/20 hover:bg-white/5"
              }`}
            >
              .bmod
            </button>
            <button
              onClick={() => setTypeFilter("tbank")}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                typeFilter === "tbank"
                  ? "bg-white text-black border-white"
                  : "border-white/20 hover:bg-white/5"
              }`}
            >
              .tbank
            </button>
          </div>
        </div>

        {/* Artifacts Grid */}
        <div className="space-y-3 mb-8">
          {filteredArtifacts.length === 0 ? (
            <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8 text-center text-white/60">
              No artifacts found
            </div>
          ) : (
            filteredArtifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => router.push(`/a/${artifact.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded bg-white/10 border border-white/10 text-xs">
                      {badge(artifact.type)}
                    </span>
                    <span className="text-xs text-white/60">
                      {new Date(artifact.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/u/${artifact.owner_username}`);
                    }}
                    className="text-xs text-white/70 hover:text-white hover:underline"
                  >
                    @{artifact.owner_username}
                  </button>
                </div>

                <div className="font-medium mb-1">{artifact.title}</div>
                {artifact.description && (
                  <div className="text-sm text-white/70 mb-3 line-clamp-2">
                    {artifact.description}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span>❤️ {artifact.like_count || 0}</span>
                  <span>🔗 {artifact.share_count || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Large Chat Widget */}
        {currentUserId && currentUsername && (
          <LiveChat
            currentUserId={currentUserId}
            username={currentUsername}
            userSchool={schoolName}
            large={true}
          />
        )}
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
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
  file_url: string;
  owner_username?: string;
  like_count?: number;
  download_count?: number;
}

export default function SchoolDirectoryPage() {
  const router = useRouter();
  const params = useParams<{ schoolName?: string; SchoolName?: string }>();
  const pathname = usePathname();
  
  // Robust school name extraction with pathname fallback
  const rawSchoolName =
    (params?.schoolName as string | string[] | undefined) ??
    (params?.SchoolName as string | string[] | undefined) ??
    (() => {
      const segments = pathname?.split("/").filter(Boolean) ?? [];
      return segments[segments.length - 1];
    })();

  const schoolName =
    typeof rawSchoolName === "string"
      ? decodeURIComponent(rawSchoolName)
      : Array.isArray(rawSchoolName) && rawSchoolName.length > 0
      ? decodeURIComponent(rawSchoolName[0])
      : "";

  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [topSets, setTopSets] = useState<Artifact[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [mostDownloaded, setMostDownloaded] = useState<Artifact[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [filteredArtifacts, setFilteredArtifacts] = useState<Artifact[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "bset" | "bmod" | "tbank">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Collapsible widget states
  const [topSetsExpanded, setTopSetsExpanded] = useState(true);
  const [topUsersExpanded, setTopUsersExpanded] = useState(true);
  const [mostDownloadedExpanded, setMostDownloadedExpanded] = useState(true);

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

          // Get like counts and download counts for all artifacts
          const artifactIds = artifactsData.map(a => a.id);
          const { data: likes } = await supabase
            .from("artifact_likes")
            .select("artifact_id")
            .in("artifact_id", artifactIds);

          const { data: downloads } = await supabase
            .from("artifact_downloads")
            .select("artifact_id")
            .in("artifact_id", artifactIds);

          const likeCounts: Record<string, number> = {};
          (likes ?? []).forEach((like) => {
            likeCounts[like.artifact_id] = (likeCounts[like.artifact_id] || 0) + 1;
          });

          const downloadCounts: Record<string, number> = {};
          (downloads ?? []).forEach((download) => {
            downloadCounts[download.artifact_id] = (downloadCounts[download.artifact_id] || 0) + 1;
          });

          const artifactsWithCounts = artifactsWithOwners.map(artifact => ({
            ...artifact,
            like_count: likeCounts[artifact.id] || 0,
            download_count: downloadCounts[artifact.id] || 0,
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

            // Get top 10 most downloaded (all types)
            const topDownloaded = artifactsWithCounts
              .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
              .slice(0, 10);
            setMostDownloaded(topDownloaded);
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

  async function handleDownload(artifactId: string, fileUrl: string, fileName: string) {
    if (!currentUserId) return;

    // Record download in database
    await supabase.from("artifact_downloads").insert({
      artifact_id: artifactId,
      user_id: currentUserId,
    });

    // Trigger download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();

    // Refresh page to update counts
    window.location.reload();
  }

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">{schoolName}</h1>
          <p className="text-sm text-white/70">{members.length} member{members.length !== 1 ? 's' : ''} · {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {/* Left Column - Member Directory & Subject Prefs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Subject Preferences */}
            {currentUserId && (
              <SubjectPreferences
                userId={currentUserId}
                userSchool={schoolName}
                onUpdate={() => window.location.reload()}
              />
            )}

            {/* Member Directory Preview */}
            <div className="border border-white/10 bg-[#1e1e1e] rounded-xl p-4">
              <h2 className="text-lg font-bold mb-3">Members</h2>
              <div className="grid md:grid-cols-2 gap-2">
                {members.slice(0, 6).map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => router.push(`/u/${member.username}`)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white border border-white flex-shrink-0"
                      style={{ backgroundColor: '#66b2ff' }}
                    >
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">@{member.username}</div>
                      <div className="text-xs text-white/60">
                        {member.upload_count} upload{member.upload_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {members.length > 6 && (
                <p className="text-xs text-white/60 mt-3 text-center">
                  and {members.length - 6} more member{members.length - 6 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Compact Collapsible Widgets */}
          <div className="space-y-3">
            {/* Top Rated Sets */}
            <div className="border border-white/10 bg-[#1e1e1e] rounded-xl overflow-hidden">
              <button
                onClick={() => setTopSetsExpanded(!topSetsExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
              >
                <h2 className="text-sm font-bold">Top Rated Sets</h2>
                <svg
                  className={`w-4 h-4 transition-transform ${topSetsExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {topSetsExpanded && (
                <div className="px-3 pb-3">
                  {topSets.length === 0 ? (
                    <p className="text-xs text-white/60">No .bset files yet</p>
                  ) : (
                    <div className="space-y-2">
                      {topSets.slice(0, 5).map((artifact, index) => (
                        <button
                          key={artifact.id}
                          onClick={() => router.push(`/a/${artifact.id}`)}
                          className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-white/40 text-xs font-bold">#{index + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium line-clamp-1">{artifact.title}</div>
                              <div className="text-xs text-white/60">@{artifact.owner_username} · ❤️ {artifact.like_count || 0}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Top Rated Users */}
            <div className="border border-white/10 bg-[#1e1e1e] rounded-xl overflow-hidden">
              <button
                onClick={() => setTopUsersExpanded(!topUsersExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
              >
                <h2 className="text-sm font-bold">Top Rated Users</h2>
                <svg
                  className={`w-4 h-4 transition-transform ${topUsersExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {topUsersExpanded && (
                <div className="px-3 pb-3">
                  {topUsers.length === 0 ? (
                    <p className="text-xs text-white/60">No likes yet</p>
                  ) : (
                    <div className="space-y-2">
                      {topUsers.slice(0, 5).map((user, index) => (
                        <button
                          key={user.user_id}
                          onClick={() => router.push(`/u/${user.username}`)}
                          className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <span className="text-white/40 text-xs font-bold w-4">#{index + 1}</span>
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white flex-shrink-0"
                            style={{ backgroundColor: '#66b2ff' }}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">@{user.username}</div>
                            <div className="text-xs text-white/60">❤️ {user.total_likes} likes</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Most Downloaded */}
            <div className="border border-white/10 bg-[#1e1e1e] rounded-xl overflow-hidden">
              <button
                onClick={() => setMostDownloadedExpanded(!mostDownloadedExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
              >
                <h2 className="text-sm font-bold">Most Downloaded</h2>
                <svg
                  className={`w-4 h-4 transition-transform ${mostDownloadedExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mostDownloadedExpanded && (
                <div className="px-3 pb-3">
                  {mostDownloaded.length === 0 ? (
                    <p className="text-xs text-white/60">No downloads yet</p>
                  ) : (
                    <div className="space-y-2">
                      {mostDownloaded.slice(0, 5).map((artifact, index) => (
                        <button
                          key={artifact.id}
                          onClick={() => router.push(`/a/${artifact.id}`)}
                          className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-white/40 text-xs font-bold">#{index + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 border border-white/10">
                                  {badge(artifact.type)}
                                </span>
                              </div>
                              <div className="text-xs font-medium line-clamp-1">{artifact.title}</div>
                              <div className="text-xs text-white/60">@{artifact.owner_username} · ⬇️ {artifact.download_count || 0}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-3">All Artifacts</h2>
          
          {/* Search Bar */}
          <div className="mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artifacts by title, description, or username..."
              className="w-full px-4 py-2 rounded-lg bg-[#1e1e1e] border border-white/20 focus:border-white/40 focus:outline-none text-sm"
            />
          </div>

          {/* Type Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                typeFilter === "all"
                  ? "bg-white text-black border-white"
                  : "border-white/20 hover:bg-white/5"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter("bset")}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                typeFilter === "bset"
                  ? "bg-white text-black border-white"
                  : "border-white/20 hover:bg-white/5"
              }`}
            >
              .bset
            </button>
            <button
              onClick={() => setTypeFilter("bmod")}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                typeFilter === "bmod"
                  ? "bg-white text-black border-white"
                  : "border-white/20 hover:bg-white/5"
              }`}
            >
              .bmod
            </button>
            <button
              onClick={() => setTypeFilter("tbank")}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
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
        <div className="space-y-3 mb-6">
          {filteredArtifacts.length === 0 ? (
            <div className="border border-white/10 bg-[#1e1e1e] rounded-xl p-6 text-center text-sm text-white/60">
              No artifacts found
            </div>
          ) : (
            filteredArtifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="border border-white/10 bg-[#1e1e1e] rounded-xl p-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs rounded bg-white/10 border border-white/10">
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

                <button
                  onClick={() => router.push(`/a/${artifact.id}`)}
                  className="text-left w-full mb-2"
                >
                  <div className="font-medium text-sm mb-1">{artifact.title}</div>
                  {artifact.description && (
                    <div className="text-xs text-white/70 line-clamp-2">
                      {artifact.description}
                    </div>
                  )}
                </button>

                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span>❤️ {artifact.like_count || 0}</span>
                  <button
                    onClick={() => handleDownload(artifact.id, artifact.file_url, `${artifact.title}.${artifact.type}`)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    <span>{artifact.download_count || 0}</span>
                  </button>
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
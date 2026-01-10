"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import ProfilePicture from "../../components/ProfilePicture";
import { ABA_LAW_SCHOOLS } from "../../lib/lawschools";

interface UserProfile {
  user_id: string;
  username: string;
  law_school: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  upload_count: number;
  friend_count: number;
  total_likes: number;
  total_downloads: number;
}

interface Artifact {
  id: string;
  type: "bset" | "bmod" | "tbank";
  title: string;
  description: string | null;
  created_at: string;
  visibility: "private" | "unlisted" | "public";
  like_count?: number;
  download_count?: number;
}

// School logo mapping - add your images here
const SCHOOL_LOGOS: Record<string, string> = {
  "UCLA": '', // Add UCLA logo path
  "Harvard University": '', // Add Harvard logo path
  "Yale University": '', // Add Yale logo path
  "Stanford University": '', // Add Stanford logo path
  "Columbia University": '', // Add Columbia logo path
};

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [sortBy, setSortBy] = useState<"likes" | "downloads" | "name">("likes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editSchool, setEditSchool] = useState("");

  // Edit artifact state
  const [editingArtifact, setEditingArtifact] = useState<Artifact | null>(null);
  const [editVisibility, setEditVisibility] = useState<"private" | "unlisted" | "public">("public");

  useEffect(() => {
    async function loadData() {
      if (!username) return;

      try {
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || null;
        setCurrentUserId(userId);

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, username, law_school, bio, profile_picture_url")
          .eq("username", username)
          .single();

        if (profileError || !profileData) {
          setError("User not found");
          setLoading(false);
          return;
        }

        // Check if viewing own profile
        const ownProfile = userId === profileData.user_id;
        setIsOwnProfile(ownProfile);

        // Get upload count
        const { count: uploadCount } = await supabase
          .from("artifacts")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", profileData.user_id)
          .eq("visibility", "public");

        // Get friend count
        const { count: friendCount } = await supabase
          .from("friend_requests")
          .select("id", { count: "exact", head: true })
          .or(`requester_id.eq.${profileData.user_id},recipient_id.eq.${profileData.user_id}`)
          .eq("status", "accepted");

        // Get all user's artifacts for total stats
        const { data: userArtifacts } = await supabase
          .from("artifacts")
          .select("id")
          .eq("owner_id", profileData.user_id)
          .eq("visibility", "public");

        const userArtifactIds = (userArtifacts ?? []).map(a => a.id);

        // Get total likes across all artifacts
        const { count: totalLikes } = await supabase
          .from("artifact_likes")
          .select("id", { count: "exact", head: true })
          .in("artifact_id", userArtifactIds);

        // Get total downloads across all artifacts
        const { count: totalDownloads } = await supabase
          .from("artifact_downloads")
          .select("id", { count: "exact", head: true })
          .in("artifact_id", userArtifactIds);

        setProfile({
          ...profileData,
          upload_count: uploadCount ?? 0,
          friend_count: friendCount ?? 0,
          total_likes: totalLikes ?? 0,
          total_downloads: totalDownloads ?? 0,
        });

        setEditBio(profileData.bio || "");
        setEditSchool(profileData.law_school || "");

        // Get pending friend requests count (only for own profile)
        if (ownProfile && userId) {
          const { count: pendingCount } = await supabase
            .from("friend_requests")
            .select("id", { count: "exact", head: true })
            .eq("recipient_id", userId)
            .eq("status", "pending");
          
          setPendingRequestCount(pendingCount ?? 0);
        }

        // Get artifacts
        const artifactsQuery = supabase
          .from("artifacts")
          .select("id, type, title, description, created_at, visibility")
          .eq("owner_id", profileData.user_id)
          .order("created_at", { ascending: false });

        // Only show public artifacts if not own profile
        if (!ownProfile) {
          artifactsQuery.eq("visibility", "public");
        }

        const { data: artifactsData } = await artifactsQuery;
        
        if (artifactsData && artifactsData.length > 0) {
          const artifactIds = artifactsData.map(a => a.id);

          // Get likes for each artifact
          const { data: likes } = await supabase
            .from("artifact_likes")
            .select("artifact_id")
            .in("artifact_id", artifactIds);

          const likeCounts: Record<string, number> = {};
          (likes ?? []).forEach((like) => {
            likeCounts[like.artifact_id] = (likeCounts[like.artifact_id] || 0) + 1;
          });

          // Get downloads for each artifact
          const { data: downloads } = await supabase
            .from("artifact_downloads")
            .select("artifact_id")
            .in("artifact_id", artifactIds);

          const downloadCounts: Record<string, number> = {};
          (downloads ?? []).forEach((download) => {
            downloadCounts[download.artifact_id] = (downloadCounts[download.artifact_id] || 0) + 1;
          });

          const artifactsWithCounts = artifactsData.map(artifact => ({
            ...artifact,
            like_count: likeCounts[artifact.id] || 0,
            download_count: downloadCounts[artifact.id] || 0,
          }));

          setArtifacts(artifactsWithCounts);
        } else {
          setArtifacts(artifactsData ?? []);
        }

        document.title = `@${username} - briefica`;
        setLoading(false);
      } catch (err) {
        setError("Failed to load profile");
        setLoading(false);
      }
    }

    loadData();
  }, [username]);

  function handleProfilePictureUpdate(newUrl: string) {
    setProfile(prev => prev ? { ...prev, profile_picture_url: newUrl } : null);
  }

  async function saveProfile() {
    if (!currentUserId || !profile) return;

    await supabase
      .from("profiles")
      .update({
        bio: editBio.trim() || null,
        law_school: editSchool || null,
      })
      .eq("user_id", currentUserId);

    setProfile({
      ...profile,
      bio: editBio.trim() || null,
      law_school: editSchool || null,
    });

    setIsEditingProfile(false);
  }

  async function handleDeleteArtifact(artifactId: string) {
    if (!currentUserId) return;

    const confirmed = window.confirm("Are you sure you want to delete this artifact?");
    if (!confirmed) return;

    await supabase
      .from("artifacts")
      .delete()
      .eq("id", artifactId)
      .eq("owner_id", currentUserId);

    setArtifacts(prev => prev.filter(a => a.id !== artifactId));
  }

  function openEditModal(artifact: Artifact) {
    setEditingArtifact(artifact);
    setEditVisibility(artifact.visibility);
  }

  function closeEditModal() {
    setEditingArtifact(null);
  }

  async function saveArtifactVisibility() {
    if (!editingArtifact || !currentUserId) return;

    await supabase
      .from("artifacts")
      .update({ visibility: editVisibility })
      .eq("id", editingArtifact.id)
      .eq("owner_id", currentUserId);

    setArtifacts(prev => 
      prev.map(a => 
        a.id === editingArtifact.id 
          ? { ...a, visibility: editVisibility }
          : a
      )
    );

    closeEditModal();
  }

  function badge(type: Artifact["type"]) {
    return type === "bset" ? ".bset" : type === "bmod" ? ".bmod" : ".tbank";
  }

  function visibilityBadge(visibility: Artifact["visibility"]) {
    if (visibility === "private") {
      return (
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          Private
        </span>
      );
    }
    if (visibility === "unlisted") {
      return (
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
          Unlisted
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
        Public
      </span>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-white/70">Loading...</p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white/70 hover:text-white flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to dashboard
          </button>
          <p className="text-red-400">{error || "Profile not found"}</p>
        </div>
      </main>
    );
  }

  const schoolLogo = profile.law_school ? SCHOOL_LOGOS[profile.law_school] : null;

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-4xl mx-auto">
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

        {/* Profile Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Profile Info */}
          <div className="md:col-span-2">
            <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <ProfilePicture
                  userId={profile.user_id}
                  currentPictureUrl={profile.profile_picture_url}
                  username={profile.username}
                  size={100}
                  editable={isOwnProfile}
                  onUpdate={handleProfilePictureUpdate}
                />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-1">@{profile.username}</h1>
                  {profile.law_school && (
                    <div className="flex items-center gap-2 mb-2">
                      {schoolLogo && (
                        <Image
                          src={schoolLogo}
                          alt={profile.law_school}
                          width={24}
                          height={24}
                          className="rounded object-cover"
                        />
                      )}
                      <span className="text-blue-400">{profile.law_school}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-white/70 mt-2">
                    <span>Uploads: {profile.upload_count}</span>
                    <span>Likes: {profile.total_likes}</span>
                    <span>Downloads: {profile.total_downloads}</span>
                    <button
                      onClick={() => router.push("/friends")}
                      className="hover:text-white hover:underline"
                    >
                      Friends: {profile.friend_count}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isOwnProfile && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors"
                  >
                    Edit Profile
                  </button>
                  {pendingRequestCount > 0 && (
                    <button
                      onClick={() => router.push("/friends")}
                      className="rounded-lg py-2 px-4 font-medium text-white transition-colors"
                      style={{ backgroundColor: '#66b2ff' }}
                    >
                      You have {pendingRequestCount} friend request{pendingRequestCount !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Bio */}
          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-6">
            <h2 className="font-semibold mb-3">Bio</h2>
            {profile.bio ? (
              <p className="text-sm text-white/80 whitespace-pre-wrap">{profile.bio}</p>
            ) : (
              <p className="text-sm text-white/50">No bio yet</p>
            )}
          </div>
        </div>

        {/* Uploads Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Uploads</h2>
            {artifacts.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-white/70">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "likes" | "downloads" | "name")}
                  className="px-3 py-1 rounded-lg bg-[#1e1e1e] border border-white/20 focus:border-white/40 focus:outline-none text-sm"
                >
                  <option value="likes">Likes</option>
                  <option value="downloads">Downloads</option>
                  <option value="name">Name</option>
                </select>
              </div>
            )}
          </div>

          {artifacts.length === 0 ? (
            <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8 text-center text-white/60">
              {isOwnProfile ? "You haven't uploaded any artifacts yet." : "No public uploads yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {[...artifacts]
                .sort((a, b) => {
                  if (sortBy === "likes") {
                    return (b.like_count ?? 0) - (a.like_count ?? 0);
                  }
                  if (sortBy === "downloads") {
                    return (b.download_count ?? 0) - (a.download_count ?? 0);
                  }
                  return a.title.localeCompare(b.title);
                })
                .map((artifact) => (
                  <div
                    key={artifact.id}
                    className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded bg-white/10 border border-white/10 text-xs">
                          {badge(artifact.type)}
                        </span>
                        {isOwnProfile && (
                          <span className="text-xs text-white/60">
                            {visibilityBadge(artifact.visibility)}
                          </span>
                        )}
                        <span className="text-xs text-white/60">
                          {new Date(artifact.created_at).toLocaleString()}
                        </span>
                      </div>
                      {isOwnProfile && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(artifact)}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteArtifact(artifact.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => router.push(`/a/${artifact.id}`)}
                      className="text-left w-full mb-2"
                    >
                      <div className="font-medium mb-1">{artifact.title}</div>
                      {artifact.description && (
                        <div className="text-sm text-white/70 line-clamp-2">
                          {artifact.description}
                        </div>
                      )}
                    </button>
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {artifact.like_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        {artifact.download_count || 0}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Law School</label>
                <select
                  value={editSchool}
                  onChange={(e) => setEditSchool(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none"
                >
                  <option value="">Select a school</option>
                  {ABA_LAW_SCHOOLS.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveProfile}
                className="flex-1 bg-white text-black rounded-lg py-2 px-4 font-medium hover:bg-white/90 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Artifact Visibility Modal */}
      {editingArtifact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h2 className="text-xl font-bold mb-4">Edit Artifact Visibility</h2>
            <p className="text-sm text-white/70 mb-4">{editingArtifact.title}</p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setEditVisibility("public")}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  editVisibility === "public"
                    ? "border-white bg-white/10"
                    : "border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  Public
                </div>
                <div className="text-xs text-white/60 ml-6">Anyone can see this artifact</div>
              </button>
              
              <button
                onClick={() => setEditVisibility("unlisted")}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  editVisibility === "unlisted"
                    ? "border-white bg-white/10"
                    : "border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                  </svg>
                  Unlisted
                </div>
                <div className="text-xs text-white/60 ml-6">Only people with the link can see this</div>
              </button>
              
              <button
                onClick={() => setEditVisibility("private")}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  editVisibility === "private"
                    ? "border-white bg-white/10"
                    : "border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                  Private
                </div>
                <div className="text-xs text-white/60 ml-6">Only you can see this artifact</div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveArtifactVisibility}
                className="flex-1 bg-white text-black rounded-lg py-2 px-4 font-medium hover:bg-white/90 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={closeEditModal}
                className="flex-1 border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
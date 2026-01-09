"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import ProfilePicture from "../../components/ProfilePicture";
import { ABA_LAW_SCHOOLS, getLawSchoolLogo } from "../../lib/lawschools";

type UserProfile = {
  user_id: string;
  username: string;
  law_school: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  upload_count: number;
  friend_count: number;
};

type Artifact = {
  id: string;
  type: "bset" | "bmod" | "tbank";
  title: string;
  description: string | null;
  created_at: string;
};

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLawSchool, setEditLawSchool] = useState("");
  const [editBio, setEditBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = `@${username} - briefica`;
  }, [username]);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id || null;
      setCurrentUserId(userId);

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, username, law_school, bio, profile_picture_url")
        .eq("username", username)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }

      // Check if this is the current user's profile
      setIsOwnProfile(userId === profileData.user_id);

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

      setProfile({
        ...profileData,
        upload_count: uploadCount ?? 0,
        friend_count: friendCount ?? 0,
      });

      setEditLawSchool(profileData.law_school || "");
      setEditBio(profileData.bio || "");

      // Load artifacts
      const { data: artifactsData } = await supabase
        .from("artifacts")
        .select("id, type, title, description, created_at")
        .eq("owner_id", profileData.user_id)
        .eq("visibility", "public")
        .order("created_at", { ascending: false });

      setArtifacts(artifactsData ?? []);
      setLoading(false);
    }

    loadProfile();
  }, [username]);

  async function handleSave() {
    if (!profile) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        law_school: editLawSchool || null,
        bio: editBio || null,
      })
      .eq("user_id", profile.user_id);

    if (!error) {
      setProfile({
        ...profile,
        law_school: editLawSchool || null,
        bio: editBio || null,
      });
      setIsEditing(false);
    }

    setSaving(false);
  }

  function handleProfilePictureUpdate(newUrl: string) {
    if (profile) {
      setProfile({ ...profile, profile_picture_url: newUrl });
    }
  }

  function badge(t: Artifact["type"]) {
    return t === "bset" ? ".bset" : t === "bmod" ? ".bmod" : ".tbank";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-white/70">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-white/70">User not found.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-white/70 hover:text-white underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </main>
    );
  }

  const profileSchoolLogo = getLawSchoolLogo(profile.law_school);

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-6xl mx-auto">
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
            <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
              <div className="flex items-start gap-6 mb-6">
                <ProfilePicture
                  userId={profile.user_id}
                  currentPictureUrl={profile.profile_picture_url}
                  username={profile.username}
                  size={100}
                  editable={isOwnProfile}
                  onUpdate={handleProfilePictureUpdate}
                />

                <div className="flex-1">
                  <div className="flex flex-col gap-1 mb-2">
                    <h1 className="text-3xl font-bold">@{profile.username}</h1>
                    {/* Law School */}
                    {isEditing ? null : profile.law_school ? (
                      profileSchoolLogo ? (
                        <Image
                          src={profileSchoolLogo}
                          alt={`${profile.law_school} logo`}
                          width={64}
                          height={64}
                          className="rounded"
                        />
                      ) : (
                        <span className="text-lg text-white/70">{profile.law_school}</span>
                      )
                    ) : null}
                  </div>

                  {isEditing ? (
                    <select
                      value={editLawSchool}
                      onChange={(e) => setEditLawSchool(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none mb-3"
                    >
                      <option value="">Select law school...</option>
                      {ABA_LAW_SCHOOLS.map((school) => (
                        <option key={school} value={school}>
                          {school}
                        </option>
                      ))}
                    </select>
                  ) : (
                    !profile.law_school && (
                      <p className="text-lg text-white/70 mb-4">
                        No law school set
                      </p>
                    )
                  )}

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-white/60">Uploads: </span>
                      <span className="font-medium">{profile.upload_count}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Friends: </span>
                      <span className="font-medium">{profile.friend_count}</span>
                    </div>
                  </div>

                  {/* Edit Button */}
                  {isOwnProfile && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-4 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-sm"
                    >
                      Edit Profile
                    </button>
                  )}

                  {/* Save/Cancel Buttons */}
                  {isEditing && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-white hover:opacity-90 transition-colors disabled:opacity-50"
                        style={{ backgroundColor: '#66b2ff' }}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditLawSchool(profile.law_school || "");
                          setEditBio(profile.bio || "");
                        }}
                        className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Bio */}
          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3">Bio</h2>

            {isEditing ? (
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Write a short bio..."
                maxLength={500}
                rows={6}
                className="w-full px-3 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none resize-none"
              />
            ) : (
              <p className="text-white/70 whitespace-pre-wrap">
                {profile.bio || "No bio yet."}
              </p>
            )}

            {isEditing && (
              <p className="text-xs text-white/50 mt-2">
                {editBio.length}/500 characters
              </p>
            )}
          </div>
        </div>

        {/* Uploads Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Uploads</h2>

          {artifacts.length === 0 ? (
            <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8 text-center text-white/60">
              No public uploads yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => router.push(`/a/${artifact.id}`)}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="inline-block px-2 py-1 rounded bg-white/10 border border-white/10 text-xs">
                      {badge(artifact.type)}
                    </span>
                    <span className="text-xs text-white/60">
                      {new Date(artifact.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="font-medium">{artifact.title}</div>
                  {artifact.description && (
                    <div className="text-sm text-white/70 mt-1 line-clamp-2">
                      {artifact.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

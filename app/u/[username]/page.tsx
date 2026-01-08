"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type Artifact = {
  id: string;
  type: "bset" | "bmod" | "tbank";
  title: string;
  description: string | null;
  created_at: string;
};

type Profile = {
  user_id: string;
  username: string;
  law_school: string | null;
};

type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [uploadCount, setUploadCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [editingLawSchool, setEditingLawSchool] = useState(false);
  const [lawSchoolInput, setLawSchoolInput] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setCurrentUserId(userData.user.id);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!username) return;

    async function load() {
      setMsg(null);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, username, law_school")
        .eq("username", username)
        .single();

      if (profileError || !profileData) {
        setMsg("Profile not found");
        return;
      }

      setProfile(profileData);
      setLawSchoolInput(profileData.law_school ?? "");
      setIsOwnProfile(currentUserId === profileData.user_id);

      // Load artifacts
      const { data: artifactsData } = await supabase
        .from("artifacts")
        .select("id, type, title, description, created_at")
        .eq("owner_id", profileData.user_id)
        .eq("visibility", "public")
        .order("created_at", { ascending: false });

      setArtifacts(artifactsData ?? []);
      setUploadCount((artifactsData ?? []).length);

      // Load download count
      const { count: dlCount } = await supabase
        .from("artifact_downloads")
        .select("id", { count: "exact", head: true })
        .in(
          "artifact_id",
          (artifactsData ?? []).map((a) => a.id)
        );

      setDownloadCount(dlCount ?? 0);

      // Load friend count
      const { count: friendC } = await supabase
        .from("friend_requests")
        .select("id", { count: "exact", head: true })
        .or(`requester_id.eq.${profileData.user_id},recipient_id.eq.${profileData.user_id}`)
        .eq("status", "accepted");

      setFriendCount(friendC ?? 0);

      // Check friend status
      if (currentUserId && currentUserId !== profileData.user_id) {
        await checkFriendStatus(currentUserId, profileData.user_id);
      }
    }

    load();
  }, [username, currentUserId]);

  async function checkFriendStatus(myId: string, theirId: string) {
    // Check if we sent them a request
    const { data: sentRequest } = await supabase
      .from("friend_requests")
      .select("status")
      .eq("requester_id", myId)
      .eq("recipient_id", theirId)
      .single();

    if (sentRequest) {
      if (sentRequest.status === "accepted") {
        setFriendStatus("friends");
      } else if (sentRequest.status === "pending") {
        setFriendStatus("pending_sent");
      }
      return;
    }

    // Check if they sent us a request
    const { data: receivedRequest } = await supabase
      .from("friend_requests")
      .select("status")
      .eq("requester_id", theirId)
      .eq("recipient_id", myId)
      .single();

    if (receivedRequest) {
      if (receivedRequest.status === "accepted") {
        setFriendStatus("friends");
      } else if (receivedRequest.status === "pending") {
        setFriendStatus("pending_received");
      }
      return;
    }

    setFriendStatus("none");
  }

  async function sendFriendRequest() {
    if (!currentUserId || !profile) return;

    const { error } = await supabase.from("friend_requests").insert({
      requester_id: currentUserId,
      recipient_id: profile.user_id,
      status: "pending",
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    setFriendStatus("pending_sent");
    setMsg("Friend request sent!");
    setTimeout(() => setMsg(null), 2000);
  }

  async function cancelFriendRequest() {
    if (!currentUserId || !profile) return;

    const { error } = await supabase
      .from("friend_requests")
      .delete()
      .eq("requester_id", currentUserId)
      .eq("recipient_id", profile.user_id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setFriendStatus("none");
    setMsg("Friend request cancelled.");
    setTimeout(() => setMsg(null), 2000);
  }

  async function removeFriend() {
    if (!currentUserId || !profile) return;

    // Delete the friend request (from either direction)
    const { error } = await supabase
      .from("friend_requests")
      .delete()
      .or(
        `and(requester_id.eq.${currentUserId},recipient_id.eq.${profile.user_id}),and(requester_id.eq.${profile.user_id},recipient_id.eq.${currentUserId})`
      );

    if (error) {
      setMsg(error.message);
      return;
    }

    setFriendStatus("none");
    setFriendCount((prev) => Math.max(0, prev - 1));
    setMsg("Friend removed.");
    setTimeout(() => setMsg(null), 2000);
  }

  async function saveLawSchool() {
    if (!currentUserId || !profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ law_school: lawSchoolInput.trim() || null })
      .eq("user_id", currentUserId);

    if (error) {
      setMsg(error.message);
      return;
    }

    setProfile({ ...profile, law_school: lawSchoolInput.trim() || null });
    setEditingLawSchool(false);
    setMsg("Law school updated!");
    setTimeout(() => setMsg(null), 2000);
  }

  function badge(t: Artifact["type"]) {
    return t === "bset" ? ".bset" : t === "bmod" ? ".bmod" : ".tbank";
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
        <p className="text-white/70">{msg ?? "Loading..."}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-white/60 hover:text-white mb-6"
        >
          ← Back to dashboard
        </button>

        {msg && (
          <div className="mb-4 p-3 rounded-lg border text-white" style={{ backgroundColor: 'rgba(102, 178, 255, 0.1)', borderColor: 'rgba(102, 178, 255, 0.2)' }}>
            {msg}
          </div>
        )}

        <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-semibold">@{profile.username}</h1>

              {/* Law School */}
              {isOwnProfile && editingLawSchool ? (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={lawSchoolInput}
                    onChange={(e) => setLawSchoolInput(e.target.value)}
                    placeholder="e.g., Harvard Law School"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none text-sm"
                  />
                  <button
                    onClick={saveLawSchool}
                    className="bg-white text-black rounded-lg py-2 px-4 text-sm font-medium hover:bg-white/90 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingLawSchool(false);
                      setLawSchoolInput(profile.law_school ?? "");
                    }}
                    className="border border-white/20 rounded-lg py-2 px-4 text-sm font-medium hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-3">
                  {profile.law_school ? (
                    <p className="text-white/70">{profile.law_school}</p>
                  ) : isOwnProfile ? (
                    <p className="text-white/50 text-sm">No law school set</p>
                  ) : null}
                  
                  {isOwnProfile && (
                    <button
                      onClick={() => setEditingLawSchool(true)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <span className="text-white/60">Uploads: </span>
                  <span className="font-medium">{uploadCount}</span>
                </div>
                <div>
                  <span className="text-white/60">Downloads: </span>
                  <span className="font-medium">{downloadCount}</span>
                </div>
                <div>
                  <span className="text-white/60">Friends: </span>
                  <span className="font-medium">{friendCount}</span>
                </div>
              </div>
            </div>

            {/* Friend Action Button */}
            {!isOwnProfile && currentUserId && (
              <div>
                {friendStatus === "none" && (
                  <button
                    onClick={sendFriendRequest}
                    className="text-white rounded-lg py-2 px-4 font-medium transition-colors"
                    style={{ backgroundColor: '#66b2ff' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5aa3ee'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#66b2ff'}
                  >
                    Add Friend
                  </button>
                )}

                {friendStatus === "pending_sent" && (
                  <button
                    onClick={cancelFriendRequest}
                    className="border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors"
                  >
                    Request Sent
                  </button>
                )}

                {friendStatus === "pending_received" && (
                  <button
                    onClick={() => router.push("/friends")}
                    className="text-white rounded-lg py-2 px-4 font-medium transition-colors"
                    style={{ backgroundColor: '#66b2ff' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5aa3ee'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#66b2ff'}
                  >
                    Accept Request
                  </button>
                )}

                {friendStatus === "friends" && (
                  <button
                    onClick={removeFriend}
                    className="border border-red-500/50 text-red-400 rounded-lg py-2 px-4 font-medium hover:bg-red-500/10 transition-colors"
                  >
                    Remove Friend
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <h2 className="text-xl font-semibold mt-8 mb-4">Uploads</h2>

        {artifacts.length === 0 ? (
          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8 text-center text-white/60">
            No uploads yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {artifacts.map((artifact) => (
              <button
                key={artifact.id}
                onClick={() => router.push(`/a/${artifact.id}`)}
                className="text-left border border-white/10 bg-[#1e1e1e] rounded-2xl p-4 hover:bg-[#252525] transition"
              >
                <div className="text-xs text-white/60">
                  <span className="inline-block px-2 py-1 rounded bg-white/10 border border-white/10">
                    {badge(artifact.type)}
                  </span>
                  <span className="ml-3">
                    {new Date(artifact.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="mt-2 font-medium">{artifact.title}</div>
                {artifact.description && (
                  <div className="text-sm text-white/70 mt-1 line-clamp-2">
                    {artifact.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
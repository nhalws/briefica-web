"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";

interface Friend {
  user_id: string;
  username: string;
  profile_picture_url: string | null;
  request_id: string;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  requester_username: string;
  requester_profile_picture_url: string | null;
  created_at: string;
}

export default function FriendsPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Friends - briefica";
  }, []);

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/auth");
        return;
      }

      setCurrentUserId(userData.user.id);
      await loadFriends(userData.user.id);
      await loadPendingRequests(userData.user.id);
      setLoading(false);
    }

    loadData();
  }, [router]);

  async function loadFriends(userId: string) {
    const { data: requests } = await supabase
      .from("friend_requests")
      .select(`
        id,
        requester_id,
        recipient_id,
        requester:profiles!friend_requests_requester_id_fkey(user_id, username, profile_picture_url),
        recipient:profiles!friend_requests_recipient_id_fkey(user_id, username, profile_picture_url)
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
              profile_picture_url: recipientProfile.profile_picture_url,
              request_id: req.id,
            });
          }
        } else {
          const requesterProfile = req.requester as any;
          if (requesterProfile) {
            friendsList.push({
              user_id: requesterProfile.user_id,
              username: requesterProfile.username,
              profile_picture_url: requesterProfile.profile_picture_url,
              request_id: req.id,
            });
          }
        }
      });
      
      setFriends(friendsList);
    }
  }

  async function loadPendingRequests(userId: string) {
    const { data: requests } = await supabase
      .from("friend_requests")
      .select(`
        id,
        requester_id,
        created_at,
        requester:profiles!friend_requests_requester_id_fkey(username, profile_picture_url)
      `)
      .eq("recipient_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (requests) {
      const formatted = requests.map((req: any) => ({
        id: req.id,
        requester_id: req.requester_id,
        requester_username: req.requester?.username ?? "unknown",
        requester_profile_picture_url: req.requester?.profile_picture_url,
        created_at: req.created_at,
      }));
      setPendingRequests(formatted);
    }
  }

  async function removeFriend(requestId: string) {
    if (!currentUserId) return;

    const confirmed = window.confirm("Are you sure you want to remove this friend?");
    if (!confirmed) return;

    await supabase
      .from("friend_requests")
      .delete()
      .eq("id", requestId);

    await loadFriends(currentUserId);
  }

  async function acceptRequest(requestId: string) {
    if (!currentUserId) return;

    await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    await loadFriends(currentUserId);
    await loadPendingRequests(currentUserId);
  }

  async function rejectRequest(requestId: string) {
    if (!currentUserId) return;

    await supabase
      .from("friend_requests")
      .delete()
      .eq("id", requestId);

    await loadPendingRequests(currentUserId);
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

        <h1 className="text-3xl font-bold mb-6">Friends</h1>

        {/* Pending Friend Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Pending Requests ({pendingRequests.length})</h2>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-white/10 bg-[#1e1e1e] rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white border-2 border-white"
                      style={{ backgroundColor: '#66b2ff' }}
                    >
                      {request.requester_username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <button
                        onClick={() => router.push(`/u/${request.requester_username}`)}
                        className="font-semibold hover:underline"
                      >
                        @{request.requester_username}
                      </button>
                      <p className="text-xs text-white/60">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(request.id)}
                      className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
                      style={{ backgroundColor: '#66b2ff' }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectRequest(request.id)}
                      className="px-4 py-2 rounded-lg border border-white/20 font-medium hover:bg-white/5 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">My Friends ({friends.length})</h2>
          {friends.length === 0 ? (
            <div className="border border-white/10 bg-[#1e1e1e] rounded-xl p-8 text-center text-white/60">
              You don't have any friends yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {friends.map((friend) => (
                <div
                  key={friend.user_id}
                  className="border border-white/10 bg-[#1e1e1e] rounded-xl p-4 flex items-center justify-between"
                >
                  <button
                    onClick={() => router.push(`/u/${friend.username}`)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white border-2 border-white flex-shrink-0"
                      style={{ backgroundColor: '#66b2ff' }}
                    >
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">@{friend.username}</div>
                    </div>
                  </button>
                  <button
                    onClick={() => removeFriend(friend.request_id)}
                    className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
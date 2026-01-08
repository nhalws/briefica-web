"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type FriendRequest = {
  id: string;
  requester_id: string;
  requester_username: string;
  created_at: string;
};

export default function FriendsPage() {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/auth");
        return;
      }

      setCurrentUserId(data.user.id);
      await loadPendingRequests(data.user.id);
    }
    init();
  }, [router]);

  async function loadPendingRequests(userId: string) {
    const { data, error } = await supabase
      .from("friend_requests")
      .select(`
        id,
        requester_id,
        created_at,
        profiles!friend_requests_requester_id_fkey(username)
      `)
      .eq("recipient_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setMsg(error.message);
      return;
    }

    const formatted = (data ?? []).map((req: any) => ({
      id: req.id,
      requester_id: req.requester_id,
      requester_username: req.profiles?.username ?? "unknown",
      created_at: req.created_at,
    }));

    setPendingRequests(formatted);
  }

  async function acceptRequest(requestId: string) {
    const { error } = await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    if (error) {
      setMsg(error.message);
      return;
    }

    if (currentUserId) {
      await loadPendingRequests(currentUserId);
    }
    
    setMsg("Friend request accepted!");
    setTimeout(() => setMsg(null), 2000);
  }

  async function rejectRequest(requestId: string) {
    const { error } = await supabase
      .from("friend_requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      setMsg(error.message);
      return;
    }

    if (currentUserId) {
      await loadPendingRequests(currentUserId);
    }

    setMsg("Friend request rejected.");
    setTimeout(() => setMsg(null), 2000);
  }

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Friend Requests</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-lg border text-white" style={{ backgroundColor: 'rgba(102, 178, 255, 0.1)', borderColor: 'rgba(102, 178, 255, 0.2)' }}>
            {msg}
          </div>
        )}

        {pendingRequests.length === 0 ? (
          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8 text-center">
            <p className="text-white/60">No pending friend requests.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <button
                      onClick={() => router.push(`/u/${req.requester_username}`)}
                      className="font-medium hover:underline"
                    >
                      @{req.requester_username}
                    </button>
                    <p className="text-sm text-white/60 mt-1">
                      Sent {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(req.id)}
                      className="text-white rounded-lg py-2 px-4 font-medium transition-colors"
                      style={{ backgroundColor: '#66b2ff' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5aa3ee'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#66b2ff'}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectRequest(req.id)}
                      className="border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
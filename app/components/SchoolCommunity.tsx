"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

interface SchoolMember {
  user_id: string;
  username: string;
  profile_picture_url: string | null;
}

interface SchoolCommunityProps {
  userSchool: string | null;
  currentUserId: string;
}

export default function SchoolCommunity({ userSchool, currentUserId }: SchoolCommunityProps) {
  const router = useRouter();
  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userSchool) {
      setLoading(false);
      return;
    }

    async function loadSchoolMembers() {
      // Get total count
      const { count } = await supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("law_school", userSchool)
        .neq("user_id", currentUserId);

      setTotalCount(count ?? 0);

      // Get first 5 members for preview
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, profile_picture_url")
        .eq("law_school", userSchool)
        .neq("user_id", currentUserId)
        .limit(5);

      setMembers(data ?? []);
      setLoading(false);
    }

    loadSchoolMembers();
  }, [userSchool, currentUserId]);

  if (!userSchool) {
    return (
      <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4">
        <h2 className="font-semibold mb-2">School Community</h2>
        <p className="text-sm text-white/60">
          Set your law school in your profile to join your school community.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4">
        <h2 className="font-semibold mb-2">School Community</h2>
        <p className="text-sm text-white/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">{userSchool}</h2>
        <span className="text-xs text-white/60">{totalCount} members</span>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-white/60">No other members yet.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 mb-3">
            {members.slice(0, 3).map((member) => (
              <button
                key={member.user_id}
                onClick={() => router.push(`/u/${member.username}`)}
                className="flex items-center gap-2 text-left px-2 py-1 rounded-lg hover:bg-white/5 transition-colors text-sm"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white"
                  style={{ backgroundColor: '#66b2ff' }}
                >
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <span>@{member.username}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => router.push(`/school/${encodeURIComponent(userSchool)}`)}
            className="w-full text-center py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-sm"
          >
            View All ({totalCount})
          </button>
        </>
      )}
    </div>
  );
}
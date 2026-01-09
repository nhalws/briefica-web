"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";

interface SchoolMember {
  user_id: string;
  username: string;
  profile_picture_url: string | null;
  upload_count?: number;
}

export default function SchoolDirectoryPage() {
  const router = useRouter();
  const params = useParams();
  const schoolName = decodeURIComponent(params.schoolName as string);

  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${schoolName} - briefica`;
  }, [schoolName]);

  useEffect(() => {
    async function loadSchoolDirectory() {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id || null);

      // Load all members from this school
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, username, profile_picture_url")
        .eq("law_school", schoolName)
        .order("username", { ascending: true });

      if (!profilesData) {
        setLoading(false);
        return;
      }

      // Get upload counts for each member
      const membersWithCounts = await Promise.all(
        profilesData.map(async (profile) => {
          const { count } = await supabase
            .from("artifacts")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", profile.user_id)
            .eq("visibility", "public");

          return {
            ...profile,
            upload_count: count ?? 0,
          };
        })
      );

      setMembers(membersWithCounts);
      setLoading(false);
    }

    loadSchoolDirectory();
  }, [schoolName]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-white/70">Loading directory...</p>
        </div>
      </main>
    );
  }

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

        {/* School Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{schoolName}</h1>
          <p className="text-white/70">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Members Grid */}
        {members.length === 0 ? (
          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8 text-center text-white/60">
            No members found at this school yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white border-2 border-white"
                    style={{ backgroundColor: '#66b2ff' }}
                  >
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={() => router.push(`/u/${member.username}`)}
                      className="font-semibold hover:text-white/80 transition-colors"
                    >
                      @{member.username}
                    </button>
                    <p className="text-sm text-white/60">
                      {member.upload_count} upload{member.upload_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {member.user_id !== currentUserId && (
                  <button
                    onClick={() => router.push(`/u/${member.username}`)}
                    className="w-full py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-sm"
                  >
                    View Profile
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
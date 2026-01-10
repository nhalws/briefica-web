"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";
import { ABA_LAW_SCHOOLS } from "../lib/lawschools";

type Subject = {
  id: string;
  name: string;
  school_name: string;
};

type ArtifactVisibility = "public" | "private" | "unlisted";
type ArtifactType = "bset" | "bmod" | "tbank";

export default function UploadPage() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userSchool, setUserSchool] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Must match your enum artifact_visibility_v2 labels
  const [visibility, setVisibility] = useState<ArtifactVisibility>("public");

  // Must match your enum artifact_type labels
  const [type, setType] = useState<ArtifactType>("bset");

  const [file, setFile] = useState<File | null>(null);

  // These UI fields stay, but we will NOT insert them unless the table has columns for them
  const [school, setSchool] = useState<string>("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [tags, setTags] = useState("");

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadKey, setUploadKey] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Upload - briefica";
  }, []);

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/auth");
        return;
      }

      setCurrentUserId(userData.user.id);

      // Get user's school from profile (this is fine even if artifacts table has no school column)
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("law_school")
        .eq("user_id", userData.user.id)
        .single();

      if (!profileErr && profile?.law_school) {
        setUserSchool(profile.law_school);
        setSchool(profile.law_school);
        await loadSubjects(profile.law_school);
      }
    }

    init();
  }, [router]);

  async function loadSubjects(schoolName: string) {
    if (!schoolName) {
      setAvailableSubjects([]);
      return;
    }

    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("school_name", schoolName)
      .order("name", { ascending: true });

    setAvailableSubjects(!error && data ? data : []);
  }

  async function handleSchoolChange(newSchool: string) {
    setSchool(newSchool);
    setSelectedSubjects([]);
    if (newSchool) await loadSubjects(newSchool);
    else setAvailableSubjects([]);
  }

  function handleSubjectToggle(subjectId: string) {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  }

  const acceptString = useMemo(() => ".bset,.bmod,.tbank", []);

  async function handleUpload() {
    if (!currentUserId) return;

    if (!title.trim()) return setError("Title is required");
    if (!file) return setError("Please select a file");

    setUploading(true);
    setError(null);
    setUploadKey(null);

    try {
      // Validate extension (users can rename files, so enforce)
      const fileExt = (file.name.split(".").pop() || "").toLowerCase();
      if (!["bset", "bmod", "tbank"].includes(fileExt)) {
        throw new Error("Invalid file type. Must be .bset, .bmod, or .tbank");
      }

      // Storage key MUST match your storage RLS policy expectations:
      // <uid>/<type>/<timestamp>.<ext>
      const ts = Date.now();
      const objectName = `${ts}.${fileExt}`;
      const storageKey = `${currentUserId}/${type}/${objectName}`;

      setUploadKey(storageKey);

      // Upload to bucket "artifacts"
      const { error: uploadError } = await supabase.storage
        .from("artifacts")
        .upload(storageKey, file, {
          upsert: false,
          contentType: "application/octet-stream",
        });

      if (uploadError) throw uploadError;

      // IMPORTANT: Insert into artifacts table using ONLY columns that exist.
      // Your table has: owner_id, type, title, description, storage_key, visibility
      const { data: artifact, error: artifactError } = await supabase
        .from("artifacts")
        .insert({
          owner_id: currentUserId,
          type, // enum artifact_type
          title: title.trim(),
          description: description.trim() || null,
          visibility, // enum artifact_visibility_v2
          storage_key: storageKey,
        })
        .select()
        .single();

      if (artifactError) throw artifactError;

      // Subject linking (only if you have artifact_subjects table + policies configured)
      if (selectedSubjects.length > 0 && artifact?.id) {
        const subjectLinks = selectedSubjects.map((subjectId) => ({
          artifact_id: artifact.id,
          subject_id: subjectId,
        }));

        const { error: subjectsError } = await supabase
          .from("artifact_subjects")
          .insert(subjectLinks);

        // Don't hard-fail the whole upload if subject linking fails
        if (subjectsError) {
          console.error("ARTIFACT_SUBJECTS INSERT ERROR:", subjectsError);
        }
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err?.message || "Upload failed");
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white/70 hover:text-white flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to dashboard
          </button>

          <Image src="/logo_6.png" alt="briefica" width={140} height={42} className="object-contain" />
        </div>

        <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-6">upload to briefica</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {uploadKey && (
            <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-lg text-white/70 text-sm">
              Upload key: <span className="text-white">{uploadKey}</span>
            </div>
          )}

          {/* Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Type *</label>
            <div className="flex gap-3">
              {(["bset", "bmod", "tbank"] as ArtifactType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    type === t ? "bg-white text-black border-white" : "border-white/20 hover:bg-white/5"
                  }`}
                >
                  .{t}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., CrimPro Final Outline"
              className="w-full px-4 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your artifact..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none resize-none"
            />
          </div>

          {/* School Selection (UI only; not persisted unless you add a column later) */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              School {userSchool && "(from your profile)"}
            </label>
            <select
              value={school}
              onChange={(e) => handleSchoolChange(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none"
            >
              <option value="">Select school (optional)</option>
              {ABA_LAW_SCHOOLS.map((schoolName) => (
                <option key={schoolName} value={schoolName}>
                  {schoolName}
                </option>
              ))}
            </select>
            <p className="text-xs text-white/50 mt-1">
              (Not saved to artifacts table unless you add an artifacts.school column)
            </p>
          </div>

          {/* Subject Selection */}
          {school && availableSubjects.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Subjects (optional)</label>
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => handleSubjectToggle(subject.id)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedSubjects.includes(subject.id) ? "text-white" : "border border-white/20 hover:bg-white/5"
                    }`}
                    style={selectedSubjects.includes(subject.id) ? { backgroundColor: "#66b2ff" } : {}}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags (UI only) */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Tags (optional)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., fall 2025, langer, final exam"
              className="w-full px-4 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none"
            />
            <p className="text-xs text-white/50 mt-1">
              (Not saved to artifacts table unless you add an artifacts.tags column)
            </p>
          </div>

          {/* File */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">File *</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept={acceptString}
              className="w-full px-4 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none"
            />
            <p className="text-xs text-white/50 mt-1">Accepted formats: .bset, .bmod, .tbank</p>
          </div>

          {/* Visibility */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Visibility *</label>
            <div className="flex gap-3">
              {(["public", "unlisted", "private"] as ArtifactVisibility[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    visibility === v ? "bg-white text-black border-white" : "border-white/20 hover:bg-white/5"
                  }`}
                >
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !title.trim() || !file}
            className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#66b2ff" }}
          >
            {uploading ? "Uploading..." : "Upload Artifact"}
          </button>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";
import { ABA_LAW_SCHOOLS } from "../lib/lawschools";

type Subject = {
  id: string;
  name: string;
  school_name: string;
};

export default function UploadPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userSchool, setUserSchool] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">("public");
  const [type, setType] = useState<"bset" | "bmod" | "tbank">("bset");
  const [file, setFile] = useState<File | null>(null);
  const [school, setSchool] = useState<string>("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set page title
  useEffect(() => {
    document.title = 'Upload - briefica';
  }, []);

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/auth");
        return;
      }

      setCurrentUserId(userData.user.id);

      // Get user's school from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("law_school")
        .eq("user_id", userData.user.id)
        .single();

      if (profile?.law_school) {
        setUserSchool(profile.law_school);
        setSchool(profile.law_school);
        // Load subjects for user's school
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

    if (!error && data) {
      setAvailableSubjects(data);
    } else {
      setAvailableSubjects([]);
    }
  }

  async function handleSchoolChange(newSchool: string) {
    setSchool(newSchool);
    setSelectedSubjects([]); // Clear subjects when school changes
    if (newSchool) {
      await loadSubjects(newSchool);
    } else {
      setAvailableSubjects([]);
    }
  }

  function handleSubjectToggle(subjectId: string) {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  }

  async function handleUpload() {
    if (!currentUserId) return;
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
      const filePath = `artifacts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("artifacts")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("artifacts").getPublicUrl(filePath);

      // Create artifact record with preserved filename
      const { data: artifact, error: artifactError } = await supabase
        .from("artifacts")
        .insert({
          owner_id: currentUserId,
          type,
          title: title.trim(),
          description: description.trim() || null,
          visibility,
          file_url: publicUrl,
          storage_key: filePath,
          original_filename: file.name, // PRESERVE ORIGINAL FILENAME
          school: school || null,
          tags: tags.trim() || null,
        })
        .select()
        .single();

      if (artifactError) {
        console.error("ARTIFACT INSERT ERROR:", artifactError);
        throw artifactError;
      }

      // Link subjects to artifact
      if (selectedSubjects.length > 0 && artifact) {
        const subjectLinks = selectedSubjects.map((subjectId) => ({
          artifact_id: artifact.id,
          subject_id: subjectId,
        }));

        const { error: subjectsError } = await supabase
          .from("artifact_subjects")
          .insert(subjectLinks);

        if (subjectsError) {
          console.error("ARTIFACT_SUBJECTS INSERT ERROR:", subjectsError);
          throw subjectsError;
        }
      }

      // Success! Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed");
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
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

          <Image
            src="/logo_6.png"
            alt="briefica"
            width={140}
            height={42}
            className="object-contain"
          />
        </div>

        {/* Upload Form */}
        <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-6">upload to briefica</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Type *</label>
            <div className="flex gap-3">
              <button
                onClick={() => setType("bset")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  type === "bset"
                    ? "bg-white text-black border-white"
                    : "border-white/20 hover:bg-white/5"
                }`}
              >
                .bset
              </button>
              <button
                onClick={() => setType("bmod")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  type === "bmod"
                    ? "bg-white text-black border-white"
                    : "border-white/20 hover:bg-white/5"
                }`}
              >
                .bmod
              </button>
              <button
                onClick={() => setType("tbank")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  type === "tbank"
                    ? "bg-white text-black border-white"
                    : "border-white/20 hover:bg-white/5"
                }`}
              >
                .tbank
              </button>
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

          {/* School Selection */}
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
              If blank, artifact will only be findable via search or your profile
            </p>
          </div>

          {/* Subject Selection */}
          {school && availableSubjects.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Subjects (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => handleSubjectToggle(subject.id)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedSubjects.includes(subject.id)
                        ? "text-white"
                        : "border border-white/20 hover:bg-white/5"
                    }`}
                    style={
                      selectedSubjects.includes(subject.id)
                        ? { backgroundColor: "#66b2ff" }
                        : {}
                    }
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/50 mt-1">
                Select all relevant subjects for this artifact
              </p>
            </div>
          )}

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Tags (optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., fall 2025, langer, final exam"
              className="w-full px-4 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none"
            />
            <p className="text-xs text-white/50 mt-1">
              Comma-separated tags to help others find your artifact
            </p>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">File *</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".bset,.bmod,.tbank"
              className="w-full px-4 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none"
            />
            <p className="text-xs text-white/50 mt-1">
              Accepted formats: .bset, .bmod, .tbank
            </p>
          </div>

          {/* Visibility */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Visibility *</label>
            <div className="flex gap-3">
              <button
                onClick={() => setVisibility("public")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  visibility === "public"
                    ? "bg-white text-black border-white"
                    : "border-white/20 hover:bg-white/5"
                }`}
              >
                Public
              </button>
              <button
                onClick={() => setVisibility("friends")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  visibility === "friends"
                    ? "bg-white text-black border-white"
                    : "border-white/20 hover:bg-white/5"
                }`}
              >
                Friends
              </button>
              <button
                onClick={() => setVisibility("private")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  visibility === "private"
                    ? "bg-white text-black border-white"
                    : "border-white/20 hover:bg-white/5"
                }`}
              >
                Private
              </button>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Public: Anyone can see • Unlisted: Only with link • Private: Only you
            </p>
          </div>

          {/* Upload Button */}
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

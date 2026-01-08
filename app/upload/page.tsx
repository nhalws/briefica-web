"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleUpload() {
    if (!file || !title.trim()) {
      setMsg("Please select a file and provide a title.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["bset", "bmod", "tbank"].includes(ext)) {
      setMsg("Only .bset, .bmod, or .tbank files are allowed.");
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Generate unique storage key but preserve original filename for download
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const storageKey = `${profile.user_id}/${timestamp}-${randomSuffix}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("artifacts")
        .upload(storageKey, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("artifacts").insert({
        owner_id: profile.user_id,
        type: ext as "bset" | "bmod" | "tbank",
        title: title.trim(),
        description: description.trim() || null,
        visibility,
        storage_key: storageKey,
        original_filename: file.name, // Store original filename
      });

      if (dbError) throw dbError;

      setMsg("Upload successful!");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e: any) {
      setMsg(e?.message ?? "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Upload Artifact</h1>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">File</label>
            <input
              type="file"
              accept=".bset,.bmod,.tbank"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full px-4 py-2 rounded-lg bg-[#1e1e1e] border border-white/20 focus:border-white/40 focus:outline-none"
            />
            <p className="text-xs text-white/60 mt-1">
              Accepted: .bset, .bmod, .tbank
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., CrimPro Fall '25"
              className="w-full px-4 py-2 rounded-lg bg-[#1e1e1e] border border-white/20 focus:border-white/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's in this artifact?"
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-[#1e1e1e] border border-white/20 focus:border-white/40 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Visibility</label>
            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as "public" | "unlisted" | "private")
              }
              className="w-full px-4 py-2 rounded-lg bg-[#1e1e1e] border border-white/20 focus:border-white/40 focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>

          <button
            onClick={handleUpload}
            disabled={busy}
            className="bg-white text-black rounded-lg py-2 px-4 font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {busy ? "Uploading..." : "Upload"}
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          {msg && <p className="text-sm text-white/70">{msg}</p>}
        </div>
      </div>
    </main>
  );
}
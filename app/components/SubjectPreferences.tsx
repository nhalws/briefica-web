"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Subject = {
  id: string;
  name: string;
  school_name: string;
};

interface SubjectPreferencesProps {
  userId: string;
  userSchool: string | null;
  onUpdate?: () => void;
}

export default function SubjectPreferences({
  userId,
  userSchool,
  onUpdate,
}: SubjectPreferencesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [savedSubjects, setSavedSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, [userId, userSchool]);

  async function loadSubjects() {
    setLoading(true);

    // Load user's saved subject preferences
    const { data: preferences } = await supabase
      .from("user_subject_preferences")
      .select("subject_id, subjects(*)")
      .eq("user_id", userId);

    if (preferences) {
      const subjects = preferences
        .map((p: any) => p.subjects)
        .filter(Boolean);
      setSavedSubjects(subjects);
      setSelectedSubjects(subjects.map((s: Subject) => s.id));
    }

    // Load available subjects for user's school
    if (userSchool) {
      const { data: schoolSubjects } = await supabase
        .from("subjects")
        .select("*")
        .eq("school_name", userSchool)
        .order("name", { ascending: true });

      if (schoolSubjects) {
        setAvailableSubjects(schoolSubjects);
      }
    }

    setLoading(false);
  }

  function handleToggleSubject(subjectId: string) {
    setSelectedSubjects((prev) => {
      if (prev.includes(subjectId)) {
        return prev.filter((id) => id !== subjectId);
      } else {
        if (prev.length >= 3) {
          alert("Maximum 3 subjects allowed. Please deselect one first.");
          return prev;
        }
        return [...prev, subjectId];
      }
    });
  }

  async function handleSave() {
    setSaving(true);

    try {
      // Delete all existing preferences
      await supabase
        .from("user_subject_preferences")
        .delete()
        .eq("user_id", userId);

      // Insert new preferences
      if (selectedSubjects.length > 0) {
        const preferences = selectedSubjects.map((subjectId) => ({
          user_id: userId,
          subject_id: subjectId,
        }));

        await supabase.from("user_subject_preferences").insert(preferences);
      }

      // Reload subjects
      await loadSubjects();
      setIsEditing(false);
      
      // Notify parent component
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences");
    }

    setSaving(false);
  }

  function handleCancel() {
    // Reset to saved subjects
    setSelectedSubjects(savedSubjects.map((s) => s.id));
    setIsEditing(false);
  }

  if (!userSchool) {
    return (
      <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4">
        <h2 className="font-semibold mb-2">Subject Preferences</h2>
        <p className="text-sm text-white/60">
          Set your law school in your profile to select subject preferences.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4">
        <h2 className="font-semibold mb-2">Subject Preferences</h2>
        <p className="text-sm text-white/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Subject Preferences</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-white/70 hover:text-white"
          >
            Edit
          </button>
        )}
      </div>

      {!isEditing ? (
        // Display Mode
        <div>
          {savedSubjects.length === 0 ? (
            <p className="text-sm text-white/60">
              No subjects selected. Click Edit to choose up to 3 subjects.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {savedSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="px-3 py-2 rounded-lg text-sm text-white"
                  style={{ backgroundColor: "#66b2ff" }}
                >
                  {subject.name}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-white/50 mt-3">
            Selected subjects create chat channels and filter your feed.
          </p>
        </div>
      ) : (
        // Edit Mode
        <div>
          <p className="text-sm text-white/60 mb-3">
            Select up to 3 subjects ({selectedSubjects.length}/3)
          </p>

          <div className="flex flex-col gap-2 mb-4 max-h-60 overflow-y-auto">
            {availableSubjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => handleToggleSubject(subject.id)}
                className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
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

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 rounded-lg text-white hover:opacity-90 transition-colors disabled:opacity-50 text-sm"
              style={{ backgroundColor: "#66b2ff" }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
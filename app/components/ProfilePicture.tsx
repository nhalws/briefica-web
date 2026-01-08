"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Image from "next/image";

interface ProfilePictureProps {
  userId: string;
  currentPictureUrl?: string | null;
  username: string;
  size?: number;
  editable?: boolean;
  onUpdate?: (newUrl: string) => void;
}

export default function ProfilePicture({
  userId,
  currentPictureUrl,
  username,
  size = 80,
  editable = false,
  onUpdate,
}: ProfilePictureProps) {
  const [uploading, setUploading] = useState(false);
  const [pictureUrl, setPictureUrl] = useState(currentPictureUrl);

  async function uploadPicture(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("File must be an image");
        return;
      }

      // Create a canvas to resize the image to 128x128
      const img = document.createElement("img");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = URL.createObjectURL(file);
      });

      // Resize to 128x128
      canvas.width = 128;
      canvas.height = 128;
      ctx?.drawImage(img, 0, 0, 128, 128);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9);
      });

      // Upload to Supabase Storage
      const fileExt = "jpg";
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, blob, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

      // Update database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture_url: publicUrl })
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }

      setPictureUrl(publicUrl);
      if (onUpdate) onUpdate(publicUrl);
      
      alert("Profile picture updated!");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  // Default profile picture (blue circle with white outline)
  if (!pictureUrl) {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="rounded-full flex items-center justify-center font-bold text-white border-2 border-white"
          style={{
            width: size,
            height: size,
            backgroundColor: "#66b2ff",
            fontSize: size * 0.4,
          }}
        >
          {username.charAt(0).toUpperCase()}
        </div>
        {editable && (
          <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 cursor-pointer hover:bg-white/90 transition-colors">
            <svg
              className="w-4 h-4 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <input
              type="file"
              accept="image/*"
              onChange={uploadPicture}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>
    );
  }

  // Custom profile picture
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image
        src={pictureUrl}
        alt={username}
        width={size}
        height={size}
        className="rounded-full border-2 border-white object-cover"
      />
      {editable && (
        <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 cursor-pointer hover:bg-white/90 transition-colors">
          <svg
            className="w-4 h-4 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <input
            type="file"
            accept="image/*"
            onChange={uploadPicture}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
          <div className="text-white text-xs">Uploading...</div>
        </div>
      )}
    </div>
  );
}
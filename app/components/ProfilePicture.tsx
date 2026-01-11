"use client";

import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

type ProfilePictureProps = {
  userId: string;
  currentPictureUrl: string | null;
  username: string;
  size?: number;
  editable?: boolean;
  onUpdate?: (newUrl: string) => void;
};

export default function ProfilePicture({
  userId,
  currentPictureUrl,
  username,
  size = 60,
  editable = false,
  onUpdate,
}: ProfilePictureProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to resize image to max 1024x1024 while maintaining aspect ratio
  async function resizeImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Calculate new dimensions (max 1024x1024, maintain aspect ratio)
          let width = img.width;
          let height = img.height;
          const maxSize = 1024;
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            'image/jpeg',
            0.92 // Quality (92%)
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB before resizing)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Resize image
      const resizedBlob = await resizeImage(file);
      
      // Create file from blob
      const resizedFile = new File([resizedBlob], file.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Delete old picture if exists
      if (currentPictureUrl) {
        const oldPath = currentPictureUrl.split('/profile-pictures/')[1];
        if (oldPath) {
          await supabase.storage.from('profile-pictures').remove([oldPath]);
        }
      }

      // Upload new picture
      const fileExt = 'jpg'; // Always save as JPG after resizing
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, resizedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-pictures').getPublicUrl(fileName);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Notify parent component
      if (onUpdate) {
        onUpdate(publicUrl);
      }

      setUploading(false);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
      setUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="relative inline-block">
      {currentPictureUrl ? (
        <img
          src={currentPictureUrl}
          alt={username}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center font-bold text-white"
          style={{
            width: size,
            height: size,
            backgroundColor: '#66b2ff',
            fontSize: size * 0.4,
          }}
        >
          {getInitials(username)}
        </div>
      )}

      {editable && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-colors disabled:opacity-50"
            title="Change profile picture"
          >
            {uploading ? (
              <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}

      {error && (
        <div className="absolute top-full left-0 mt-2 text-xs text-red-400 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
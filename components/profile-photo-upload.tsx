"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadProfilePhoto, validateProfilePhoto } from "@/lib/profile-photo";

type ProfilePhotoUploadProps = {
  userId?: string;
  initialUrl?: string | null;
  onFileSelected?: (file: File | null) => void;
  deferUpload?: boolean;
  onUploaded?: (url: string) => void;
};

export function ProfilePhotoUpload({
  userId,
  initialUrl = null,
  onFileSelected,
  deferUpload = false,
  onUploaded,
}: ProfilePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessage(null);

    if (!file) {
      setPreviewUrl(initialUrl);
      onFileSelected?.(null);
      return;
    }

    const validationError = validateProfilePhoto(file);
    if (validationError) {
      setMessage(validationError);
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onFileSelected?.(file);

    if (deferUpload || !userId) {
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const { error, path } = await uploadProfilePhoto(supabase, userId, file);
    setUploading(false);

    if (error) {
      setMessage(error);
      return;
    }

    if (path) {
      const { data } = await supabase.storage
        .from("profile-photos")
        .createSignedUrl(path, 3600);

      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        onUploaded?.(data.signedUrl);
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Upload profile photo"
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-zinc-300 bg-zinc-100 transition hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={previewUrl ? "Change profile photo" : "Upload profile photo"}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Profile preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-zinc-400">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-9 w-9"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 20a8 8 0 0 1 16 0"
              />
            </svg>
            <span className="text-[10px] font-medium uppercase tracking-wide">
              Add photo
            </span>
          </div>
        )}

        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.776 48.776 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
            />
          </svg>
          <span className="text-xs font-medium">
            {uploading ? "Uploading…" : previewUrl ? "Change" : "Upload"}
          </span>
        </span>
      </button>

      <p className="mt-2 text-center text-xs text-zinc-500">
        Tap to {previewUrl ? "change" : "upload"} your profile photo
      </p>
      <p className="text-center text-xs text-zinc-400">JPEG, PNG, or WebP · Max 5 MB</p>

      {message && (
        <p className="mt-3 w-full rounded-xl bg-rose-50 px-3 py-2 text-center text-sm text-rose-700">
          {message}
        </p>
      )}
    </div>
  );
}

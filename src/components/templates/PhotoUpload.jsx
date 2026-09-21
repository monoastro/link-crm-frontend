'use client';
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";

export function PhotoUpload({ existingUrl, file, onChange, readOnly }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const src = preview || existingUrl;

  return (
    <div className="flex w-40 shrink-0 flex-col items-center gap-2">
      <div className="flex h-48 w-40 items-center justify-center overflow-hidden rounded-sm border border-dashed border-gray-300 bg-gray-50">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Candidate photo" className="h-full w-full object-cover" />
        ) : (
          <Camera size={28} className="text-gray-400" />
        )}
      </div>

      {!readOnly && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-sm border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {src ? "Change photo" : "Upload photo"}
          </button>
        </>
      )}
    </div>
  );
}

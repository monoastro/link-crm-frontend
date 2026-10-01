"use client";

import { useContext, useEffect, useState } from "react";
import { FileText, Plus, Trash2, X } from "lucide-react";
import { DefaultsContext, resolveUrl } from "@/packages/admin";

function detectFileType(file) {
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("image/")) return "image";
  return null;
}

function inferFileTypeFromUrl(url = "") {
  return url.split(".").pop()?.toLowerCase() === "pdf" ? "pdf" : "image";
}

let uid = 0;
const nextId = () => `doc-${Date.now()}-${uid++}`;

export function CandidateDocumentsField({ name = "documents", caption, readOnly = false }) {
  const defaults = useContext(DefaultsContext);

  const [existingDocs, setExistingDocs] = useState([]); // already-saved docs: { id, url, fileType }
  const [slots, setSlots] = useState(() => (readOnly ? [] : [{ id: nextId(), file: null }])); // new uploads; always one trailing empty slot
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const initial = defaults?.[name];
    if (Array.isArray(initial)) {
      setExistingDocs(
        initial
          .filter((d) => d?.type !== "photo")
          .map((d) => ({ id: nextId(), url: d.url, fileType: d.fileType ?? inferFileTypeFromUrl(d.url) }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSlotChange(id, e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = detectFileType(file);
    if (!fileType) {
      alert(`"${file.name}" is not an image or PDF`);
      e.target.value = "";
      return;
    }

    setSlots((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, file, objectUrl: URL.createObjectURL(file), fileType } : s
      );
      return updated.some((s) => !s.file) ? updated : [...updated, { id: nextId(), file: null }];
    });
  }

  function removeSlot(id) {
    setSlots((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target?.objectUrl) URL.revokeObjectURL(target.objectUrl);
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.some((s) => !s.file) ? filtered : [...filtered, { id: nextId(), file: null }];
    });
  }

  function removeExisting(id) {
    setExistingDocs((prev) => prev.filter((d) => d.id !== id));
  }

  function handleTileClick(e, slot) {
    if (slot.file) {
      e.preventDefault(); // don't reopen the picker — show preview instead
      setPreview({ src: slot.objectUrl, fileType: slot.fileType });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {caption && <span className="text-sm font-medium text-gray-700">{caption}</span>}
      {readOnly && existingDocs.length === 0 && slots.length === 0 && (
        <span className="text-sm text-gray-500">No documents uploaded.</span>
      )}

      <div className="flex flex-wrap gap-4">
        {existingDocs.map((doc) => (
          <div key={doc.id} className="flex w-40 flex-col gap-2">
            <input type="hidden" name={`other_existing_${doc.id}`} value={doc.url} />
            <div className="group relative aspect-square w-full overflow-hidden rounded-sm border border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setPreview({ src: resolveUrl({ url: doc.url }), fileType: doc.fileType })}
                className="flex h-full w-full items-center justify-center"
              >
                {doc.fileType === "pdf" ? (
                  <div className="flex flex-col items-center gap-1.5 text-gray-500">
                    <FileText size={36} />
                    <span className="text-[11px]">PDF</span>
                  </div>
                ) : (
                  <img src={resolveUrl({ url: doc.url })} alt="Document" className="h-full w-full object-cover" />
                )}
              </button>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeExisting(doc.id)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeExisting(doc.id)}
                className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-red-500"
              >
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>
        ))}

        {slots.map((slot) => (
          <div
            key={slot.id}
            className="flex w-40 flex-col gap-2"
          >
            <label
              htmlFor={`slot-${slot.id}`}
              onClick={(e) => handleTileClick(e, slot)}
              className={
                slot.file
                  ? "group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-sm border border-gray-200 bg-gray-50"
                  : "flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-500"
              }
            >
              <input
                id={`slot-${slot.id}`}
                type="file"
                name={`other_${slot.id}`}
                accept="image/*,application/pdf"
                disabled={readOnly}
                className="hidden"
                onChange={(e) => handleSlotChange(slot.id, e)}
              />
              {!slot.file ? (
                <>
                  <Plus size={22} />
                  <span className="text-xs">Add document</span>
                </>
              ) : slot.fileType === "pdf" ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-gray-500">
                  <FileText size={36} />
                  <span className="text-[11px]">PDF</span>
                </div>
              ) : (
                <img src={slot.objectUrl} alt="Document" className="h-full w-full object-cover" />
              )}
            </label>
            {slot.file && !readOnly && (
              <button
                type="button"
                onClick={() => removeSlot(slot.id)}
                className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-red-500"
              >
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setPreview(null)}>
          <button type="button" onClick={() => setPreview(null)} className="absolute right-6 top-6 text-white hover:text-gray-300">
            <X size={28} />
          </button>
          <div className="flex max-h-full max-w-4xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {preview.fileType === "pdf" ? (
              <iframe src={preview.src} title="Document preview" className="h-[80vh] w-[80vw] rounded-sm bg-white" />
            ) : (
              <img src={preview.src} alt="Document preview" className="max-h-[85vh] max-w-full rounded-sm object-contain shadow-lg" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

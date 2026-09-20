// src/components/templates/CandidateDocumentsField.jsx
"use client";

import { useContext, useEffect, useState } from "react";
import { FileText, Plus, Trash2, Upload, X } from "lucide-react";
import { DefaultsContext, resolveUrl } from "@/packages/admin";

// Adjust to match your actual documentTypeEnum values.
// Each value here is also the field name the backend reads as req.files[value]
export const DOCUMENT_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "visa", label: "Visa" },
  { value: "citizenship", label: "Citizenship" },
  { value: "medical", label: "Medical" },
  { value: "offer_letter", label: "Offer Letter" },
  { value: "ticket", label: "Ticket" },
  { value: "photo", label: "Photo" },
  { value: "cv", label: "CV" },
  { value: "other", label: "Other" },
];

function detectFileType(file) {
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("image/")) return "image";
  return null;
}

function inferFileTypeFromUrl(url = "") {
  return url.split(".").pop()?.toLowerCase() === "pdf" ? "pdf" : "image";
}

let uid = 0;
function nextId() {
  uid += 1;
  return `doc-row-${Date.now()}-${uid}`;
}

export function CandidateDocumentsField({ name = "documents", caption, readOnly = false }) {
  const contextDefaults = useContext(DefaultsContext);

  // row shape: { id, type, file, objectUrl, existingUrl, fileType }
  const [rows, setRows] = useState([])

  useEffect(() => {
    const initial = contextDefaults?.[name];
    if (Array.isArray(initial)) {
      setRows(initial
        .filter((d) => d?.type)
        .map((d) => ({
          id: nextId(),
          type: d.type,
          file: null,
          objectUrl: resolveUrl({ url: d?.url }),
          existingUrl: d.url ?? "",
          fileType: d.fileType ?? inferFileTypeFromUrl(d.url),
        }))
      );
    }
  }, [contextDefaults]);

  const [preview, setPreview] = useState(null); // { src, fileType } | null

  useEffect(() => {
    return () => {
      rows.forEach((r) => r.objectUrl && URL.revokeObjectURL(r.objectUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usedTypes = rows.map((r) => r.type).filter(Boolean);
  const hasAvailableTypes = usedTypes.length < DOCUMENT_TYPES.length;

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: nextId(), type: "", file: null, objectUrl: null, existingUrl: "", fileType: "" },
    ]);
  }

  function removeRow(id) {
    setRows((prev) => {
      const row = prev.find((r) => r.id === id);
      if (row?.objectUrl) URL.revokeObjectURL(row.objectUrl);
      return prev.filter((r) => r.id !== id);
    });
  }

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function handleTypeChange(id, type) {
    const row = rows.find((r) => r.id === id);
    if (row?.objectUrl) URL.revokeObjectURL(row.objectUrl);
    updateRow(id, { type, file: null, objectUrl: null, existingUrl: "", fileType: "" });
  }

  function handleFileChange(id, e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = detectFileType(file);
    if (!fileType) {
      alert("Only image and PDF files are supported");
      e.target.value = "";
      return;
    }

    const row = rows.find((r) => r.id === id);
    if (row?.objectUrl) URL.revokeObjectURL(row.objectUrl);

    const objectUrl = URL.createObjectURL(file);
    updateRow(id, { file, objectUrl, fileType, existingUrl: "" });
  }

  function clearFile(id) {
    const row = rows.find((r) => r.id === id);
    if (row?.objectUrl) URL.revokeObjectURL(row.objectUrl);
    updateRow(id, { file: null, objectUrl: null, existingUrl: "", fileType: "" });
  }

  return (
    <div className="flex flex-col gap-3">
      {caption && <span className="text-sm font-medium text-gray-700">{caption}</span>}

      <div className="flex flex-wrap gap-4">
        {rows.map((row) => {
          const displaySrc = row.objectUrl || row.existingUrl;
          const hasFile = Boolean(displaySrc);

          const selectableTypes = DOCUMENT_TYPES.filter(
            (t) => t.value === row.type || !usedTypes.includes(t.value)
          );

          return (
            <div key={row.id} className="flex w-40 flex-col gap-2">
              {/* Type selector sits above the tile */}
              <select
                value={row.type}
                disabled={readOnly}
                onChange={(e) => handleTypeChange(row.id, e.target.value)}
                className="w-full cursor-pointer rounded-sm border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="">Select type...</option>
                {selectableTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              {row.existingUrl && !row.file && row.type && (
                <input type="hidden" name={`${row.type}_existing`} value={row.existingUrl} />
              )}

              {/* Thumbnail tile */}
              <div className="group relative aspect-square w-full overflow-hidden rounded-sm border border-gray-200 bg-gray-50">
                {!row.type ? (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                    Pick a type first
                  </div>
                ) : hasFile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreview({ src: displaySrc, fileType: row.fileType })}
                      className="flex h-full w-full items-center justify-center"
                    >
                      {row.fileType === "pdf" ? (
                        <div className="flex flex-col items-center gap-1.5 text-gray-500">
                          <FileText size={36} />
                          <span className="text-[11px]">PDF</span>
                        </div>
                      ) : (
                        <img
                          src={displaySrc}
                          alt={row.type}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </button>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => clearFile(row.id)}
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </>
                ) : (
                  !readOnly && (
                    <label htmlFor={`doc_${row.id}`} className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                      <Upload size={20} />
                      <span className="text-[11px]">Upload file</span>
                    </label>
                  )
                )}
                <input
                  type="file"
                  name={row.type}
                id={`doc_${row.id}`}
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(row.id, e)}
                />
              </div>

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              )}
            </div>
          );
        })}

        {/* Add tile — same size/shape as the document tiles */}
        {!readOnly && hasAvailableTypes && (
          <button
            type="button"
            onClick={addRow}
            className="flex w-40 flex-col items-center justify-center gap-1.5 self-start rounded-sm border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-500"
            style={{ aspectRatio: "1", marginTop: "2.5rem" }}
          >
            <Plus size={22} />
            <span className="text-xs">Add document</span>
          </button>
        )}
      </div>

      {/* Preview overlay */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute right-6 top-6 text-white hover:text-gray-300"
          >
            <X size={28} />
          </button>

          <div
            className="flex max-h-full max-w-4xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {preview.fileType === "pdf" ? (
              <iframe
                src={preview.src}
                title="Document preview"
                className="h-[80vh] w-[80vw] rounded-sm bg-white"
              />
            ) : (
              <img
                src={preview.src}
                alt="Document preview"
                className="max-h-[85vh] max-w-full rounded-sm object-contain shadow-lg"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

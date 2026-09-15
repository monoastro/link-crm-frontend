"use client";

export function CandidateDocumentsField({ name, caption }) {
  return (
    <div className="flex flex-col gap-2">
      {caption && (
        <span className="text-sm font-medium text-gray-700">{caption}</span>
      )}
      <div className="rounded-sm border border-dashed border-gray-300 p-4 text-sm text-gray-400">
        Documents field coming soon
      </div>
    </div>
  );
}

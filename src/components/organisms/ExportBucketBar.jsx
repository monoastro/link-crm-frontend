// components/admin/ExportBucketBar.jsx
"use client";
import { FileSpreadsheet, X } from "lucide-react";

export default function ExportBucketBar({ count, onClear, onOpenExport }) {
  if (count === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 flex w-fit items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-lg">
      <span className="text-sm text-gray-700">
        <span className="font-semibold text-gray-900">{count}</span>{" "}
        {count === 1 ? "candidate" : "candidates"} selected
      </span>
      <button
        type="button"
        onClick={onClear}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <X size={14} />
        Clear
      </button>
      <button
        type="button"
        onClick={onOpenExport}
        className="flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        <FileSpreadsheet size={16} />
        Export
      </button>
    </div>
  );
}

// components/admin/ExportFieldsModal.jsx
"use client";
import { useState } from "react";
import { X, Download } from "lucide-react";
import { EXPORT_FIELD_GROUPS, DEFAULT_CHECKED_KEYS } from "@/lib/exportFieldsConfig.js";
import { exportCandidatesToExcel } from "@/utils/exportExcel.js";
import { useToast } from "@/packages/admin"; // adjust import to your actual toast hook

export default function ExportFieldsModal({ candidates, onClose, onRemove }) {
  const toast = useToast?.() ?? { success: () => {} };
  const [checked, setChecked] = useState(() => new Set(DEFAULT_CHECKED_KEYS));

  const toggleField = (key) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => setChecked(new Set(EXPORT_FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key))));
  const selectNone = () => setChecked(new Set());

  const selectedFields = EXPORT_FIELD_GROUPS
    .flatMap((g) => g.fields)
    .filter((f) => checked.has(f.key));

  const handleDownload = () => {
    if (selectedFields.length === 0 || candidates.length === 0) return;
    const filename = `candidates-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    exportCandidatesToExcel(candidates, selectedFields, filename);
    toast.success(`Exported ${candidates.length} candidates`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export candidates</h2>
            <p className="text-sm text-gray-500">{candidates.length} selected — choose which fields to include</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* Field picker */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Fields to export</span>
              <div className="flex gap-3 text-xs">
                <button onClick={selectAll} className="text-gray-500 hover:text-gray-900">Select all</button>
                <button onClick={selectNone} className="text-gray-500 hover:text-gray-900">Select none</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-3">
              {EXPORT_FIELD_GROUPS.map((group) => (
                <div key={group.group} className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{group.group}</span>
                  {group.fields.map((field) => (
                    <label key={field.key} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={checked.has(field.key)}
                        onChange={() => toggleField(field.key)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-gray-900 accent-gray-900"
                      />
                      {field.label}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Preview table */}
          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">Preview</span>
            <div className="overflow-auto rounded-lg border border-gray-200" style={{ maxHeight: "260px" }}>
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    {selectedFields.map((f) => (
                      <th key={f.key} className="whitespace-nowrap px-3 py-2 text-xs font-medium uppercase text-gray-500">
                        {f.label}
                      </th>
                    ))}
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {candidates.map((c) => (
                    <tr key={c.id}>
                      {selectedFields.map((f) => (
                        <td key={f.key} className="whitespace-nowrap px-3 py-2 text-gray-600">
                          {formatPreviewValue(c, f)}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => onRemove(c.id)} className="text-gray-300 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan={selectedFields.length + 1} className="px-3 py-8 text-center text-gray-400">
                        Nothing left in the bucket.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={selectedFields.length === 0 || candidates.length === 0}
            className="flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Download Excel ({candidates.length})
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPreviewValue(candidate, field) {
  const raw = candidate[field.key];
  if (field.key === "companyId") return typeof raw === "object" ? raw?.name ?? "—" : raw ?? "—";
  if (raw == null || raw === "") return "—";
  return String(raw);
}

// components/admin/CandidatePickerTable.jsx
"use client";
import { Badge } from "@/packages/admin";

const PICKER_COLUMNS = [
  { key: "name", head: "Name" },
  { key: "passportNumber", head: "Passport" },
  { key: "phone", head: "Phone" },
  { key: "appliedCountry", head: "Country" },
  { key: "visaStatus", head: "Visa", status: true },
  { key: "medicalStatus", head: "Medical", status: true },
  { key: "flightStatus", head: "Flight", status: true },
];

export default function CandidatePickerTable({
  data,
  bucket,          // { [id]: candidate }
  onToggleOne,      // (candidate) => void
  onToggleAllOnPage, // (items, addAll) => void
  onPageChange,
}) {
  const items = data?.docs ?? data?.items ?? [];
  const total = data?.totalDocs ?? data?.total ?? items.length;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const hasNextPage = data?.hasNextPage ?? page < totalPages;
  const hasPrevPage = data?.hasPrevPage ?? page > 1;

  console.log('items', items)

  const allOnPageSelected = items.length > 0 && items.every((item) => bucket[item.id]);
  const someOnPageSelected = items.some((item) => bucket[item.id]) && !allOnPageSelected;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-10 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    ref={(el) => el && (el.indeterminate = someOnPageSelected)}
                    onChange={() => onToggleAllOnPage(items, !allOnPageSelected)}
                    disabled={items.length === 0}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 accent-gray-900"
                  />
                </th>
                {PICKER_COLUMNS.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    {col.head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const isSelected = !!bucket[item.id];
                return (
                  <tr
                    key={item.id}
                    onClick={() => onToggleOne(item)}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? "bg-blue-50/60" : ""}`}
                  >
                    <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleOne(item)}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 accent-gray-900"
                      />
                    </td>
                    {PICKER_COLUMNS.map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3 align-middle">
                        {col.status ? (
                          <Badge value={item[col.key]} variant={item[col.key] ? "default" : "default"} />
                        ) : (
                          <span className="text-sm text-gray-700">{item[col.key] || "—"}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={PICKER_COLUMNS.length + 1} className="px-4 py-12 text-center text-sm text-gray-400">
                    No candidates match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Page <span className="font-medium text-gray-700">{page}</span> of{" "}
            <span className="font-medium text-gray-700">{totalPages}</span>{" "}
            <span className="text-gray-400">({total} total)</span>
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={!hasPrevPage} onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
              Previous
            </button>
            <button type="button" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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

const checkboxClass = "h-4 w-4 rounded border-gray-300 text-gray-900 accent-gray-900";
const pageBtnClass =
  "rounded-md border border-gray-200 bg-white px-3 py-2 font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5";

// Card fields, split so the important info sits at the top
const CARD_DETAILS = PICKER_COLUMNS.filter((c) => !c.status && c.key !== "name");
const CARD_STATUSES = PICKER_COLUMNS.filter((c) => c.status);

const stop = (e) => e.stopPropagation();

export default function CandidatePickerTable({
  data,
  bucket,            // { [id]: candidate }
  onToggleOne,       // (candidate) => void
  onToggleAllOnPage, // (items, addAll) => void
  onPageChange,
}) {
  const items = data?.docs ?? data?.items ?? [];
  const total = data?.totalDocs ?? data?.total ?? items.length;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const hasNextPage = data?.hasNextPage ?? page < totalPages;
  const hasPrevPage = data?.hasPrevPage ?? page > 1;

  const allOnPageSelected = items.length > 0 && items.every((item) => bucket[item.id]);
  const someOnPageSelected = items.some((item) => bucket[item.id]) && !allOnPageSelected;

  const indeterminateRef = (el) => {
    if (el) el.indeterminate = someOnPageSelected;
  };

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {/* ---------- Mobile: cards ---------- */}
      <div className="flex flex-col gap-2 md:hidden">
        {items.length > 0 && (
          <label className="flex items-center gap-2 px-1 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              ref={indeterminateRef}
              onChange={() => onToggleAllOnPage(items, !allOnPageSelected)}
              className={checkboxClass}
            />
            Select all on this page
          </label>
        )}

        {items.map((item) => {
          const isSelected = !!bucket[item.id];
          return (
            <div
              key={item.id}
              onClick={() => onToggleOne(item)}
              className={`cursor-pointer rounded-xl border p-3 shadow-sm transition-colors active:bg-gray-50 ${
                isSelected ? "border-blue-300 bg-blue-50/60" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5" onClick={stop}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleOne(item)}
                    className={checkboxClass}
                    aria-label={`Select ${item.name ?? "candidate"}`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{item.name || "—"}</p>

                  <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {CARD_DETAILS.map((col) => (
                      <div key={col.key} className="min-w-0">
                        <dt className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          {col.head}
                        </dt>
                        <dd className="truncate text-sm text-gray-700">{item[col.key] || "—"}</dd>
                      </div>
                    ))}
                  </dl>

                  {/* Clicks here must not toggle the card's selection */}
                  <div
                    className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-gray-100 pt-2.5"
                    onClick={stop}
                  >
                    {CARD_STATUSES.map((col) => (
                      <div key={col.key} className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          {col.head}
                        </span>
                        <Badge value={item[col.key]} variant="default" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-400">
            No candidates match these filters.
          </div>
        )}
      </div>

      {/* ---------- Desktop: table ---------- */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-10 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    ref={indeterminateRef}
                    onChange={() => onToggleAllOnPage(items, !allOnPageSelected)}
                    disabled={items.length === 0}
                    className={checkboxClass}
                    aria-label="Select all rows on this page"
                  />
                </th>
                {PICKER_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
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
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      isSelected ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <td className="px-4 py-3 align-middle" onClick={stop}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleOne(item)}
                        className={checkboxClass}
                        aria-label="Select row"
                      />
                    </td>
                    {PICKER_COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className="whitespace-nowrap px-4 py-3 align-middle"
                        onClick={col.status ? stop : undefined}
                      >
                        {col.status ? (
                          <Badge value={item[col.key]} variant="default" />
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
                  <td
                    colSpan={PICKER_COLUMNS.length + 1}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No candidates match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-center text-gray-500 sm:text-left">
            Page <span className="font-medium text-gray-700">{page}</span> of{" "}
            <span className="font-medium text-gray-700">{totalPages}</span>{" "}
            <span className="text-gray-400">({total} total)</span>
          </span>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button type="button" disabled={!hasPrevPage} onClick={() => onPageChange(page - 1)} className={pageBtnClass}>
              Previous
            </button>
            <button type="button" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)} className={pageBtnClass}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

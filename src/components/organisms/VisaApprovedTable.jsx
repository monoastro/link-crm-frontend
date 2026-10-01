// components/admin/VisaApprovedTable.jsx
"use client";
import { useRouter } from "next/navigation";
import { Badge } from "@/packages/admin";
import { StatusDot } from "../atoms/StatusDot.jsx";

const COLUMNS = [
  { key: "name", head: "Name" },
  { key: "passportNumber", head: "Passport" },
  { key: "phone", head: "Phone" },
  { key: "appliedCountry", head: "Country" },
  { key: "companyId", head: "Company", relation: true },
  { key: "flightStatus", head: "Flight", status: true },
  { key: "deploymentOn", head: "Deployment Date", date: true },
];

// Card layout: name is the title, flight status is the badge, the rest are details
const CARD_DETAILS = COLUMNS.filter((c) => c.key !== "name" && !c.status);
const STATUS_COLUMN = COLUMNS.find((c) => c.status);

const pageBtnClass =
  "rounded-md border border-gray-200 bg-white px-3 py-2 font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5";

// Deployment is considered "done" once these are filled in.
// Adjust to match whatever your pipeline treats as final.
export function isDeploymentComplete(item) {
  return item.flightStatus === "deployed";
}

function relationLabel(value) {
  if (value == null) return "—";
  return typeof value === "string" ? value : value.name ?? value.id ?? "—";
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// Plain-text value for a column (used in the mobile card)
function cellText(item, col) {
  if (col.relation) return relationLabel(item[col.key]);
  if (col.date) return formatDate(item[col.key]);
  return item[col.key] || "—";
}

export default function VisaApprovedTable({ data, onPageChange }) {
  const router = useRouter();
  const items = data?.docs ?? data?.items ?? [];
  const total = data?.totalDocs ?? data?.total ?? items.length;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const hasNextPage = data?.hasNextPage ?? page < totalPages;
  const hasPrevPage = data?.hasPrevPage ?? page > 1;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {/* ---------- Mobile: cards ---------- */}
      <div className="flex flex-col gap-2 md:hidden">
        {items.map((item) => {
          const pending = !isDeploymentComplete(item);
          return (
            <div
              key={item.id}
              onClick={() => router.push(`/candidates/${item.id}`)}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-colors active:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <StatusDot show={pending} />
                  <p className="truncate text-sm font-semibold text-gray-900">{item.name || "—"}</p>
                </div>
                {STATUS_COLUMN && (
                  <div className="shrink-0">
                    <Badge
                      value={item[STATUS_COLUMN.key]}
                      variant={item[STATUS_COLUMN.key] === "deployed" ? "success" : "default"}
                    />
                  </div>
                )}
              </div>

              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {CARD_DETAILS.map((col) => (
                  <div key={col.key} className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      {col.head}
                    </dt>
                    <dd className="truncate text-sm text-gray-700">{cellText(item, col)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-400">
            No candidates found.
          </div>
        )}
      </div>

      {/* ---------- Desktop: table ---------- */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-8 px-3 py-2" />
                {COLUMNS.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    {col.head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const pending = !isDeploymentComplete(item);
                return (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/candidates/${item.id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-3 py-3 align-middle">
                      <StatusDot show={pending} />
                    </td>
                    {COLUMNS.map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3 align-middle">
                        {col.status ? (
                          <Badge value={item[col.key]} variant={item[col.key] === "deployed" ? "success" : "default"} />
                        ) : col.relation ? (
                          <span className="text-sm text-gray-700">{relationLabel(item[col.key])}</span>
                        ) : col.date ? (
                          <span className="text-sm text-gray-600">{formatDate(item[col.key])}</span>
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
                  <td colSpan={COLUMNS.length + 1} className="px-4 py-12 text-center text-sm text-gray-400">
                    No candidates found.
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

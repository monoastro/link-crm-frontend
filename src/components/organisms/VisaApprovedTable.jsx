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

export default function VisaApprovedTable({ data, onPageChange }) {
  const router = useRouter();
  const items = data?.docs ?? data?.items ?? [];
  const total = data?.totalDocs ?? data?.total ?? items.length;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const hasNextPage = data?.hasNextPage ?? page < totalPages;
  const hasPrevPage = data?.hasPrevPage ?? page > 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
                    onClick={() => router.push(`/visaApproved/${item.id}`)}
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

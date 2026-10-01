// src/app/visa-approved/page.js
"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AdminLayout, useFetchEntity } from "@/packages/admin";
import VisaApprovedTable from "@/components/organisms/VisaApprovedTable.jsx";

const TABS = [
  { key: "pending", label: "Pending Deployment" },
  { key: "completed", label: "Completed" },
];

export default function VisaApprovedListPage() {
  const [tab, setTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [tab]);

  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", limit);
  params.set("visaStatus", "Received");
  if (debouncedSearch) params.set("query", debouncedSearch);
  // If your API supports filtering flightStatus directly, uncomment:
  // params.set("flightStatus", tab === "completed" ? "deployed" : "!deployed");

  const { data } = useFetchEntity("candidates", params);

  // Client-side split as a fallback in case the API can't filter "not deployed".
  const allItems = data?.docs ?? data?.items ?? [];
  const filteredItems = allItems.filter((item) =>
    tab === "completed" ? item.flightStatus === "deployed" : item.flightStatus !== "deployed"
  );
  const scopedData = { ...data, docs: filteredItems, items: filteredItems, totalDocs: filteredItems.length, total: filteredItems.length };

  return (
    <AdminLayout title="Visa Approved">
      <div className="flex flex-col gap-5">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-black" />
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates..."
            className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm text-gray-700 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <VisaApprovedTable data={scopedData} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}

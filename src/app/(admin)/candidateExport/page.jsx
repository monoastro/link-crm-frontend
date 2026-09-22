// src/app/candidates/export/page.js
"use client";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { AdminLayout, useFetchEntity } from "@/packages/admin";
import CandidatePickerTable from "@/components/organisms/CandidatePickerTable";
import ExportBucketBar from "@/components/organisms/ExportBucketBar";
import ExportFieldsModal from "@/components/organisms/ExportFieldsModal";

// Candidates in these states are considered "export-ready" by default.
// Adjust to whatever your actual pipeline calls "done" (e.g. deployed / cleared).
const DEFAULT_FILTERS = {
  visaStatus: "approved",
  medicalStatus: "cleared",
};

const FILTER_OPTIONS = [
  { field: "visaStatus", label: "Visa Status", options: ["approved", "pending", "rejected"] },
  { field: "medicalStatus", label: "Medical Status", options: ["cleared", "pending", "failed"] },
  { field: "flightStatus", label: "Flight Status", options: ["scheduled", "deployed", "pending"] },
];

export default function CandidateExportPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [bucket, setBucket] = useState({}); // { [id]: candidate }
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", limit);
  if (debouncedSearch) params.set("query", debouncedSearch);
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));

  const { data } = useFetchEntity("candidates", params);

  const bucketList = Object.values(bucket);
  const bucketCount = bucketList.length;

  const toggleOne = (candidate) => {
    setBucket((prev) => {
      const next = { ...prev };
      if (next[candidate.id]) delete next[candidate.id];
      else next[candidate.id] = candidate;
      return next;
    });
  };

  const toggleAllOnPage = (items, addAll) => {
    setBucket((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        if (addAll) next[item.id] = item;
        else delete next[item.id];
      });
      return next;
    });
  };

  const removeFromBucket = (id) => {
    setBucket((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const clearBucket = () => setBucket({});

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-6 py-2 pb-4 min-h-22 backdrop-blur">
        <h1 className="truncate text-xl font-semibold text-gray-900">Export Candidates</h1>

        <ExportBucketBar
          count={bucketCount}
          onClear={clearBucket}
          onOpenExport={() => setShowExportModal(true)}
        />
      </header>
        {/*====Admin layout but customized above===========*/}
      <main className="flex-1 overflow-auto p-6">
        <div className="flex flex-col gap-5 pb-24">
          {/* Search + filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidates..."
                className="w-full sm:w-64 rounded-md border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm text-gray-700 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            {FILTER_OPTIONS.map((filter) => (
              <select
                key={filter.field}
                value={filters[filter.field] || ""}
                onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                className="rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-gray-700 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="">All {filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ))}

            {Object.values(filters).some(Boolean) && (
              <button
                onClick={() => setFilters({})}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
              >
                <X size={14} />
                Clear filters
              </button>
            )}
          </div>

          <CandidatePickerTable
            data={data}
            bucket={bucket}
            onToggleOne={toggleOne}
            onToggleAllOnPage={toggleAllOnPage}
            onPageChange={setPage}
          />
        </div>


        {showExportModal && (
          <ExportFieldsModal
            candidates={bucketList}
            onClose={() => setShowExportModal(false)}
            onRemove={removeFromBucket}
          />
        )}
      </main>
    </div>
  );
}

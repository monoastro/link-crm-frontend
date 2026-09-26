// src/app/candidates/export/page.js
"use client";
import { useEffect, useState } from "react";
import { Search, X, Calendar } from "lucide-react";
import { AdminLayout, useFetchEntity, useGet, SearchableSelect } from "@/packages/admin";
import CandidatePickerTable from "@/components/organisms/CandidatePickerTable";
import ExportBucketBar from "@/components/organisms/ExportBucketBar";
import ExportFieldsModal from "@/components/organisms/ExportFieldsModal";

const VISA_STATUS_OPTIONS = ["Waiting", "Received", "Rejected"];

function tomorrowISODate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function defaultFilters() {
  return {
    visaStatus: "Received",
    beforeDate: tomorrowISODate(),
  };
}

export default function CandidateExportPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [bucket, setBucket] = useState({});
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const { data: companiesData } = useGet("/companies?pageSize=100");
  const companyOptions = (companiesData?.items ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const { data: companyData, isLoading: vacanciesLoading } = useGet(
    filters.companyId ? `/companies/${filters.companyId}` : null
  );
  const categoryOptions = (companyData?.item?.vacancies ?? []).map((v) => ({
    value: v.id ?? v.code,
    label: v.position,
  }));

  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", limit);
  if (debouncedSearch) params.set("query", debouncedSearch);
  if (filters.visaStatus) params.set("visaStatus", filters.visaStatus);
  if (filters.companyId) params.set("companyId", filters.companyId);
  if (filters.categoryId) params.set("appliedCategory", filters.categoryId);
  if (filters.afterDate) params.set("afterDate", filters.afterDate);
  if (filters.beforeDate) params.set("beforeDate", filters.beforeDate);

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
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "companyId") next.categoryId = "";
      return next;
    });
    setPage(1);
  };

  const defaults = defaultFilters();
  const hasActiveFilters =
    Boolean(filters.companyId || filters.categoryId || filters.afterDate) ||
    filters.visaStatus !== defaults.visaStatus ||
    filters.beforeDate !== defaults.beforeDate;

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

      <main className="flex-1 overflow-auto p-6">
        <div className="flex flex-col gap-5 pb-24">
          {/* Filter panel — search on its own row, everything else in a
              consistent grid so fields line up instead of wrapping loosely. */}
          <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-white p-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or passport number..."
                className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm text-gray-700 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <SearchableSelect
                name="visaStatus"
                label="Visa Status"
                options={VISA_STATUS_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                value={filters.visaStatus || ""}
                onChange={(value) => handleFilterChange("visaStatus", value)}
                emptyLabel="All Visa Status"
              />

              <SearchableSelect
                name="companyId"
                label="Company"
                options={companyOptions}
                value={filters.companyId || ""}
                onChange={(value) => handleFilterChange("companyId", value)}
                emptyLabel="All Companies"
              />

              <SearchableSelect
                key={filters.companyId || "no-company"}
                name="categoryId"
                label="Category"
                options={categoryOptions}
                value={filters.categoryId || ""}
                onChange={(value) => handleFilterChange("categoryId", value)}
                disabled={!filters.companyId || vacanciesLoading}
                emptyLabel={
                  !filters.companyId
                    ? "Select a company first"
                    : vacanciesLoading
                    ? "Loading categories…"
                    : "All Categories"
                }
              />

              {/* Date range paired as one visual unit — a bordered group
                  containing both inputs, rather than two separate floating
                  fields that read as unrelated. */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Date Range</label>
                <div className="flex items-center gap-2 rounded-sm border border-gray-200 bg-white px-2 py-1 shadow-sm focus-within:border-black focus-within:ring-2 focus-within:ring-black/10">
                  <Calendar size={14} className="shrink-0 text-gray-400" />
                  <input
                    type="date"
                    value={filters.afterDate || ""}
                    max={filters.beforeDate || undefined}
                    onChange={(e) => handleFilterChange("afterDate", e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent py-1 text-sm text-gray-900 focus:outline-none focus:ring-0"
                  />
                  <span className="shrink-0 text-sm text-gray-400">to</span>
                  <input
                    type="date"
                    value={filters.beforeDate || ""}
                    min={filters.afterDate || undefined}
                    onChange={(e) => handleFilterChange("beforeDate", e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent py-1 text-sm text-gray-900 focus:outline-none focus:ring-0"
                  />
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end border-t border-gray-100 pt-3">
                <button
                  onClick={() => setFilters(defaultFilters())}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                >
                  <X size={14} />
                  Clear filters
                </button>
              </div>
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

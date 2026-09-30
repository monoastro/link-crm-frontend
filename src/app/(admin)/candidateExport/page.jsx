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

  const dateInputClass =
    "min-w-0 w-full flex-1 border-0 bg-transparent py-1 text-base text-gray-900 focus:outline-none focus:ring-0 sm:text-sm";

  return (
    <div className="flex h-full flex-col">
      {/* Header stacks on mobile: title on top, bucket bar below */}
      <header className="sticky top-0 z-10 flex flex-col gap-2 border-b border-gray-200 bg-gray-50/80 px-3 py-3 backdrop-blur sm:min-h-22 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-2 sm:pb-4">
        <h1 className="truncate text-lg font-semibold text-gray-900 sm:text-xl">Export Candidates</h1>

        <div className="w-full sm:w-auto">
          <ExportBucketBar
            count={bucketCount}
            onClear={clearBucket}
            onOpenExport={() => setShowExportModal(true)}
          />
        </div>
      </header>

      <main className="min-w-0 flex-1 overflow-auto p-3 sm:p-6">
        <div className="flex flex-col gap-4 pb-24 sm:gap-5">
          <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-white p-3 sm:p-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or passport number..."
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-base text-gray-700 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 sm:py-1.5 sm:text-sm"
              />
            </div>

            {/* 1 column on mobile, 3 on sm, 5 on lg */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

              {/* Date range: inputs stack on mobile, sit side by side from sm */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Date Range</label>
                <div className="flex flex-col gap-1 rounded-sm border border-gray-200 bg-white px-2 py-1 shadow-sm focus-within:border-black focus-within:ring-2 focus-within:ring-black/10 sm:flex-row sm:items-center sm:gap-2">
                  <div className="flex items-center gap-2 sm:flex-1">
                    <Calendar size={14} className="shrink-0 text-gray-400" />
                    <span className="w-9 shrink-0 text-sm text-gray-400 sm:hidden">From</span>
                    <input
                      type="date"
                      value={filters.afterDate || ""}
                      max={filters.beforeDate || undefined}
                      onChange={(e) => handleFilterChange("afterDate", e.target.value)}
                      className={dateInputClass}
                    />
                  </div>

                  <span className="hidden shrink-0 text-sm text-gray-400 sm:inline">to</span>

                  <div className="flex items-center gap-2 border-t border-gray-100 pt-1 sm:flex-1 sm:border-0 sm:pt-0">
                    <Calendar size={14} className="shrink-0 text-gray-400 sm:hidden" />
                    <span className="w-9 shrink-0 text-sm text-gray-400 sm:hidden">To</span>
                    <input
                      type="date"
                      value={filters.beforeDate || ""}
                      min={filters.afterDate || undefined}
                      onChange={(e) => handleFilterChange("beforeDate", e.target.value)}
                      className={dateInputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end border-t border-gray-100 pt-3">
                <button
                  onClick={() => setFilters(defaultFilters())}
                  className="flex items-center gap-1 py-1 text-sm text-gray-500 hover:text-gray-900"
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

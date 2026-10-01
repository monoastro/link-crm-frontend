// components/admin/DataTable.jsx
"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Badge } from "../atoms/Badge.jsx";
import { EditButton } from "../atoms/Buttons.jsx";
import { DeleteAction } from "../organisms/DeleteAction.jsx";
import { useEntity } from "./AdminChildrenLayout.jsx";
import { useApi } from "../../contexts/ApiContext.jsx";
import { resolveUrl } from "../../utils/utils.js";

function normalizePayloadResponse(data) {
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false };
  }
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    hasNextPage: (data?.page < data?.totalPages) || false,
    hasPrevPage: (data?.page > 1) || false,
  };
}

function resolveRelationValue(value, labelKey = "name") {
  if (value == null) return null;
  if (typeof value === "string") return { id: value, label: value };
  return { id: value.id, label: value[labelKey] ?? value.filename ?? value.id };
}

export default function DataTable({
  data,
  fields,
  editHref,
  rowHref,
  actions,
  bulkActions,
  onPageChange,
  selectable = true,
}) {
  const router = useRouter();
  const { name, mutate } = useEntity();
  const { del } = useApi();
  const { items, total, page, totalPages, hasNextPage, hasPrevPage } = normalizePayloadResponse(data);

  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const headerCheckboxRef = useRef(null);
  const mobileCheckboxRef = useRef(null);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [data]);

  const selectedCount = selectedIds.size;
  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const allOnPageSelected = items.length > 0 && selectedCount === items.length;
  const someOnPageSelected = selectedCount > 0 && !allOnPageSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) headerCheckboxRef.current.indeterminate = someOnPageSelected;
    if (mobileCheckboxRef.current) mobileCheckboxRef.current.indeterminate = someOnPageSelected;
  }, [someOnPageSelected]);

  const toggleAll = () => {
    setSelectedIds(allOnPageSelected ? new Set() : new Set(items.map((item) => item.id)));
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedCount} selected ${selectedCount === 1 ? "record" : "records"}? This can't be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map((id) => del(`/${name}/${id}`, { method: "DELETE" }))
      );
      const failed = results.filter((r) => r.status === "rejected" || r.value?.ok === false);
      if (failed.length > 0) {
        console.error(`${failed.length} of ${selectedCount} deletes failed`);
      }
      await mutate();
      setSelectedIds(new Set());
    } finally {
      setIsDeleting(false);
    }
  };

  const renderCell = (item, field) => {
    const [key, type, ...rest] = field.key.split(":");
    const value = item[key];

    switch (type) {
      case "image":
        return (
          <div className="h-9 w-9 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200">
            <img src={resolveUrl(value)} alt={field.head} className="h-full w-full object-cover" />
          </div>
        );

      case "upload": {
        const media = typeof value === "object" && value !== null ? value : null;
        const src = media?.url ? resolveUrl(media.url) : null;
        if (!src) {
          return (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 ring-1 ring-gray-200">
              —
            </div>
          );
        }
        return (
          <div className="h-9 w-9 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200">
            <img src={src} alt={media?.alt ?? field.head} className="h-full w-full object-cover" />
          </div>
        );
      }

      case "relationship": {
        const labelKey = rest[0] ?? "name";
        const resolved = resolveRelationValue(value, labelKey);
        return resolved ? (
          <span className="text-sm text-gray-700">{resolved.label}</span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        );
      }

      case "date":
        if (!value) return <span className="text-sm text-gray-400">—</span>;
        return (
          <span className="text-sm text-gray-600">
            {new Date(value).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );

      case "bold":
        return <span className="text-sm font-semibold text-gray-900">{value}</span>;

      case "status":
        return <Badge value={value} variant={value === "published" ? "success" : "default"} />;

      default:
        return (
          <div className="max-w-40 truncate text-sm text-gray-600" title={value}>
            {value}
          </div>
        );
    }
  };

  const defaultActions = (item) => (
    <>
      {editHref && (
        <Link
          href={typeof editHref === "function" ? editHref(item) : editHref + item.id}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <EditButton />
        </Link>
      )}
      <DeleteAction route={`/${name}/${item.id}`} mutate={mutate} />
    </>
  );

  const renderActions = actions ?? defaultActions;

  // Shared row/card navigation behaviour
  const navProps = (item) => ({
    onClick: () => rowHref && router.push(rowHref(item)),
    onKeyDown: (event) => {
      if (rowHref && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        router.push(rowHref(item));
      }
    },
    tabIndex: rowHref ? 0 : undefined,
    role: rowHref ? "link" : undefined,
  });

  const checkboxClass = "h-4 w-4 rounded border-gray-300 text-gray-900 accent-gray-900";

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk action bar */}
      {selectable && selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
          <span className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{selectedCount}</span>{" "}
            {selectedCount === 1 ? "record" : "records"} selected
          </span>
          <div className="flex items-center gap-3">
            {bulkActions?.({
              selectedItems,
              clearSelection: () => setSelectedIds(new Set()),
            })}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={14} />
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Mobile: cards ---------- */}
      <div className="flex flex-col gap-2 md:hidden">
        {selectable && items.length > 0 && (
          <label className="flex items-center gap-2 px-1 text-sm text-gray-600">
            <input
              ref={mobileCheckboxRef}
              type="checkbox"
              checked={allOnPageSelected}
              onChange={toggleAll}
              className={checkboxClass}
            />
            Select all on this page
          </label>
        )}

        {items.map((item, index) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <div
              key={item.id ?? index}
              {...navProps(item)}
              className={`rounded-xl border bg-white p-3 shadow-sm transition-colors ${
                isSelected ? "border-gray-400 bg-gray-50" : "border-gray-200"
              } ${rowHref ? "cursor-pointer active:bg-gray-50" : ""}`}
            >
              {(selectable || renderActions) && (
                <div
                  className="mb-2 flex items-center justify-between border-b border-gray-100 pb-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  {selectable ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(item.id)}
                      className={checkboxClass}
                      aria-label="Select row"
                    />
                  ) : (
                    <span />
                  )}
                  {renderActions && (
                    <div className="flex items-center gap-1">{renderActions(item)}</div>
                  )}
                </div>
              )}

              <dl className="flex flex-col gap-2">
                {fields.map((field, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">
                      {field.head}
                    </dt>
                    <dd className="flex min-w-0 justify-end text-right">{renderCell(item, field)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-400">
            No records found.
          </div>
        )}
      </div>

      {/* ---------- Desktop: table ---------- */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {selectable && (
                  <th className="w-10 px-4 py-3">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAll}
                      disabled={items.length === 0}
                      className={checkboxClass}
                      aria-label="Select all rows on this page"
                    />
                  </th>
                )}
                {fields.map((field, i) => (
                  <th
                    key={i}
                    className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {field.head}
                  </th>
                ))}
                {renderActions && (
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <tr
                    key={item.id ?? index}
                    {...navProps(item)}
                    className={`transition-colors hover:bg-gray-50 ${rowHref ? "cursor-pointer" : ""} ${
                      isSelected ? "bg-gray-50" : ""
                    }`}
                  >
                    {selectable && (
                      <td className="px-4 py-3 align-middle" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(item.id)}
                          className={checkboxClass}
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {fields.map((field, i) => (
                      <td key={i} className="whitespace-nowrap px-4 py-3 align-middle">
                        {renderCell(item, field)}
                      </td>
                    ))}
                    {renderActions && (
                      <td className="px-4 py-3 align-middle" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">{renderActions(item)}</div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={(selectable ? 1 : 0) + fields.length + (renderActions ? 1 : 0)}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No records found.
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
            <button
              type="button"
              disabled={!hasPrevPage}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white sm:py-1.5"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!hasNextPage}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white sm:py-1.5"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

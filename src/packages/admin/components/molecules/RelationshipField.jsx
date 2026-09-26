// src/components/atoms/RelationshipField.jsx
"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useApi } from "@/packages/admin";
import { DefaultsContext } from "@/packages/admin";

function humanize(name = "") {
  return name
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function RelationshipField({ field, onChange, readOnly = false }) {
  const {
    name: rawName,
    label,
    required,
    relationTo,
    labelField = "name",
    valueField = "id",
    excludeSelf = false,
    searchable = true,
    placeholder,
  } = field;

  const name = rawName?.split(":")?.[0];
  const contextDefaults = useContext(DefaultsContext);
  const { get } = useApi();
  const params = useParams();

  // Latest `get` in a ref so an unstable useApi identity can't retrigger the fetch effect.
  const getRef = useRef(get);
  useEffect(() => {
    getRef.current = get;
  }, [get]);

  const resolvedLabel = label ?? humanize(name);
  const resolvedPlaceholder = placeholder ?? `Select ${resolvedLabel.toLowerCase()}...`;

  // Defaults usually carry only the id; the label is resolved from the fetched options.
  const defaultValue = contextDefaults?.[name] ?? "";
  const defaultLabel =
    contextDefaults?.[`${name}Label`] ??
    contextDefaults?.[relationTo]?.[labelField] ??
    "";

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(defaultValue);
  const [selectedLabel, setSelectedLabel] = useState(defaultLabel);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const touchedRef = useRef(false);

  // If defaults arrive after mount, sync them in (unless the user already chose something).
  useEffect(() => {
    if (touchedRef.current) return;
    setSelectedId(defaultValue);
    setSelectedLabel(defaultLabel);
  }, [defaultValue, defaultLabel]);

  // True when we have an id but no label to show yet.
  const needsLabel = Boolean(selectedId) && !selectedLabel;

  // Single options fetch: runs when the dropdown is open, OR once on mount
  // when we need options just to resolve the selected label.
  useEffect(() => {
    if (!open && !needsLabel) return;

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const query = search
          ? `?query=${encodeURIComponent(search)}&pageSize=25`
          : "?pageSize=25";
        const res = await getRef.current(`/${relationTo}${query}`);
        const items = res?.data?.items ?? res?.items ?? [];

        const filtered =
          excludeSelf && params?.id
            ? items.filter((item) => item[valueField] !== params.id)
            : items;

        setOptions(filtered);
      } catch (err) {
        console.error(`Failed to fetch relation options for "${relationTo}"`, err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [open, needsLabel, search, relationTo, excludeSelf, params?.id, valueField]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayOptions = searchable || !search
    ? options
    : options.filter((o) =>
        String(o[labelField]).toLowerCase().includes(search.toLowerCase()),
      );

  function handleSelect(option) {
    touchedRef.current = true;
    setSelectedId(option[valueField]);
    setSelectedLabel(String(option[labelField]));
    onChange?.(option[valueField]);
    setOpen(false);
    setSearch("");
    setHighlightedIndex(0);
  }

  function handleOpen() {
    if (readOnly) return;
    setSearch(displayLabel);
    setOpen(true);
    setHighlightedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(event) {
    if (!open || displayOptions.length === 0) {
      if (event.key === "Enter" && !open) handleOpen();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, displayOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleSelect(displayOptions[highlightedIndex] ?? displayOptions[0]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  const resolvedSelectedOption = options.find(
    (option) => String(option[valueField]) === String(selectedId),
  );
  const displayLabel = selectedLabel || (
    needsLabel && resolvedSelectedOption
      ? String(resolvedSelectedOption[labelField])
      : ""
  );

  return (
    <div className="flex w-full flex-col gap-1.5" ref={containerRef}>
      {resolvedLabel && (
        <label className="text-sm font-medium text-gray-700">
          {resolvedLabel}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <input type="hidden" name={name} value={selectedId || ""} required={required} readOnly />

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? search : displayLabel}
          onFocus={handleOpen}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          readOnly={readOnly}
          autoComplete="off"
          className={`w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none placeholder:text-gray-400 ${readOnly ? "cursor-not-allowed bg-gray-100 opacity-60" : ""}`}
        />

        {open && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="max-h-56 overflow-y-auto p-1">
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-gray-400">
                  <Loader2 size={14} className="animate-spin" />
                  Loading…
                </div>
              ) : displayOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-gray-400">No results</div>
              ) : (
                displayOptions.map((option, index) => (
                  <button
                    key={option[valueField]}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`block w-full truncate rounded px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                      index === highlightedIndex || String(option[valueField]) === String(selectedId)
                        ? "bg-gray-100 font-medium"
                        : "text-gray-900"
                    }`}
                  >
                    {option[labelField]}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

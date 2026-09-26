"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { DefaultsContext } from "../molecules/Form.jsx";

function normalizeOption(option) {
  return typeof option === "string" ? { value: option, label: option } : option;
}

export function SearchableSelect({
  name,
  label,
  options = [],
  required = false,
  disabled = false,
  readOnly = false,
  allowAdd = false,
  onChange,
  onAddOption,
}) {
  const defaults = useContext(DefaultsContext);
  const initialValue = defaults?.[name] ?? "";
  const [value, setValue] = useState(initialValue);
  const [query, setQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newOption, setNewOption] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const touchedRef = useRef(false);

  useEffect(() => {
    if (touchedRef.current) return;
    setValue(initialValue);
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setAdding(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const normalizedOptions = options.map(normalizeOption);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedOptions
    .filter((option) => option.label.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => {
      if (!normalizedQuery) return 0;
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      const aScore = aLabel === normalizedQuery ? 0 : aLabel.startsWith(normalizedQuery) ? 1 : 2;
      const bScore = bLabel === normalizedQuery ? 0 : bLabel.startsWith(normalizedQuery) ? 1 : 2;
      return aScore - bScore;
    });

  const choose = (optionValue, optionLabel = optionValue) => {
    touchedRef.current = true;
    setValue(optionValue);
    setQuery(optionLabel);
    setHighlightedIndex(0);
    onChange?.(optionValue);
    setIsOpen(false);
    setAdding(false);
  };

  const addProfession = () => {
    const candidate = (newOption || query).trim();
    if (!candidate) return;

    onAddOption?.(candidate);
    choose(candidate, candidate);
    setNewOption("");
  };

  const openPicker = () => {
    if (disabled || readOnly) return;
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (event) => {
    if (!isOpen || filteredOptions.length === 0) {
      if (event.key === "Enter" && !isOpen) openPicker();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[highlightedIndex] ?? filteredOptions[0];
      choose(option.value, option.label);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex w-full flex-col gap-1.5">
      <label htmlFor={`${name}-search`} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input type="hidden" name={name} value={value} disabled={disabled} />
      <input
        id={`${name}-search`}
        type="text"
        value={query}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete="off"
        onFocus={(event) => {
          event.target.select();
          openPicker();
        }}
        onChange={(event) => {
          touchedRef.current = true;
          setQuery(event.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
        }}
        onKeyDown={handleKeyDown}
        className="w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
        placeholder={label}
      />

      {isOpen && !disabled && !readOnly && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="max-h-56 overflow-y-auto p-1">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option.value, option.label)}
                className={`block w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                  option.value === value || filteredOptions[highlightedIndex]?.value === option.value
                    ? "bg-gray-100 font-medium"
                    : ""
                }`}
              >
                {option.label}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-500">No matching professions.</p>
            )}
          </div>

          {allowAdd && (
            <div className="border-t border-gray-200 p-2">
              {adding ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newOption}
                    onChange={(event) => setNewOption(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addProfession();
                      }
                    }}
                    placeholder="New profession"
                    className="min-w-0 flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={addProfession}
                    className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (query.trim()) {
                      addProfession();
                    } else {
                      setAdding(true);
                    }
                  }}
                  className="w-full rounded px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  + Add new profession{query.trim() ? ` “${query.trim()}”` : ""}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

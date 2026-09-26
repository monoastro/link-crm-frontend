// src/components/molecules/SearchableSelect.jsx
"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { DefaultsContext } from "../molecules/Form.jsx";

function normalizeOption(option) {
  return typeof option === "string" ? { value: option, label: option } : option;
}

export function SearchableSelect({
  name,
  label,
  value: controlledValue,
  defaultValue,
  options = [],
  required = false,
  disabled = false,
  readOnly = false,
  allowAdd = false,
  clearable = true, // NEW: shows a ✕ clear button once something is selected
  emptyLabel, // NEW: e.g. "All Companies" — renders as a selectable "no value" row at the top of the list
  onChange,
  onAddOption,
}) {
  const defaults = useContext(DefaultsContext);
  const isControlled = controlledValue !== undefined;
  const initialValue = isControlled ? controlledValue : (defaults?.[name] ?? defaultValue ?? "");

  const normalizedOptions = options.map(normalizeOption);
  const labelFor = (val) => {
    if (!val) return emptyLabel ?? "";
    return normalizedOptions.find((o) => o.value === val)?.label ?? val;
  };

  const [value, setValue] = useState(initialValue);
  const [query, setQuery] = useState(labelFor(initialValue));
  const [filterText, setFilterText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newOption, setNewOption] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const touchedRef = useRef(false);

  useEffect(() => {
    if (isControlled || touchedRef.current) return;
    setValue(initialValue);
    setQuery(labelFor(initialValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  useEffect(() => {
    if (!isControlled) return;
    setValue(controlledValue);
    setQuery(labelFor(controlledValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledValue, options]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setAdding(false);
        setQuery(labelFor(value));
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const normalizedFilter = filterText.trim().toLowerCase();
  const filteredOptions = normalizedOptions
    .filter((option) => option.label.toLowerCase().includes(normalizedFilter))
    .sort((a, b) => {
      if (!normalizedFilter) return 0;
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      const aScore = aLabel === normalizedFilter ? 0 : aLabel.startsWith(normalizedFilter) ? 1 : 2;
      const bScore = bLabel === normalizedFilter ? 0 : bLabel.startsWith(normalizedFilter) ? 1 : 2;
      return aScore - bScore;
    });

  // The empty row is only shown when there's no active search text — typing
  // to filter narrows real options, it shouldn't also surface "All X" as a
  // matching search result.
  const showEmptyRow = Boolean(emptyLabel) && !normalizedFilter;

  const choose = (optionValue, optionLabel = optionValue) => {
    touchedRef.current = true;
    setValue(optionValue);
    setQuery(optionLabel);
    setFilterText("");
    setHighlightedIndex(0);
    onChange?.(optionValue);
    setIsOpen(false);
    setAdding(false);
  };

  const clear = (event) => {
    event.stopPropagation();
    choose("", "");
    inputRef.current?.blur();
  };

  const addProfession = () => {
    const candidate = (newOption || filterText).trim();
    if (!candidate) return;

    onAddOption?.(candidate);
    choose(candidate, candidate);
    setNewOption("");
  };

  const openPicker = () => {
    if (disabled || readOnly) return;
    setFilterText("");
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
      if (option) choose(option.value, option.label);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setQuery(labelFor(value));
    } else if (event.key === "Backspace" && filterText === "" && value) {
      // Backspacing on an empty search box while something is selected
      // clears the selection — mirrors how native comboboxes often behave.
      clear(event);
    }
  };

  const showClearButton = clearable && !disabled && !readOnly && Boolean(value);

  return (
    <div ref={containerRef} className="relative flex w-full flex-col gap-1.5">
      <label htmlFor={`${name}-search`} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input type="hidden" name={name} value={value} disabled={disabled} />

      <div className="relative">
        <input
          ref={inputRef}
          id={`${name}-search`}
          type="text"
          value={isOpen ? filterText : query}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete="off"
          onClick={openPicker}
          onFocus={(event) => {
            event.target.select();
            openPicker();
          }}
          onChange={(event) => {
            touchedRef.current = true;
            setFilterText(event.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="w-full cursor-pointer rounded-sm border border-gray-200 bg-white px-3 py-2 pr-16 text-sm text-gray-900 shadow-sm transition-colors focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
          placeholder={emptyLabel || label}
        />

        <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {showClearButton && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clear}
              className="pointer-events-auto rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              title="Clear"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen && !disabled && !readOnly && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="max-h-56 overflow-y-auto p-1">
            {showEmptyRow && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose("", "")}
                className={`block w-full rounded px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 ${
                  !value ? "bg-gray-100 font-medium" : ""
                }`}
              >
                {emptyLabel}
              </button>
            )}

            {filteredOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option.value, option.label)}
                className={`block w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                  option.value === value || index === highlightedIndex
                    ? "bg-gray-100 font-medium"
                    : ""
                }`}
              >
                {option.label}
              </button>
            ))}
            {filteredOptions.length === 0 && !showEmptyRow && (
              <p className="px-3 py-2 text-sm text-gray-500">No matching options.</p>
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
                    placeholder="New option"
                    className="min-w-0 flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-black focus:outline-none"
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
                    if (filterText.trim()) {
                      addProfession();
                    } else {
                      setAdding(true);
                    }
                  }}
                  className="w-full rounded px-3 py-2 text-left text-sm font-medium text-black hover:bg-gray-100"
                >
                  + Add new option{filterText.trim() ? ` "${filterText.trim()}"` : ""}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

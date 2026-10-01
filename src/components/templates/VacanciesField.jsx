// src/components/templates/VacanciesField.jsx
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input, Select } from "@/packages/admin";

const STATUS_OPTIONS = ["open", "closed"];

function emptyDraft() {
  return { position: "", openings: 1, status: "open" };
}

/**
 * Manages the full vacancy list for a company in local state.
 * - Existing vacancies carry `code` (server-assigned) — editing them updates
 *   in place; removing them from the list marks them for deletion on submit.
 * - New vacancies have no `code` — the server generates one on insert.
 * - `value` always holds the FULL current set (open + closed); the tabs only
 *   control which subset is rendered, not what's included in `onChange`.
 */
export function VacanciesField({ name = "vacancies", value, onChange, readOnly }) {
  const [tab, setTab] = useState("open");
  const [draft, setDraft] = useState(null);

  const vacancies = value ?? [];
  const openVacancies = vacancies.filter((v) => v.status === "open");
  const closedVacancies = vacancies.filter((v) => v.status === "closed");
  const visible = tab === "open" ? openVacancies : closedVacancies;

  const updateAt = (index, patch) => {
    const targetList = tab === "open" ? openVacancies : closedVacancies;
    const target = targetList[index];
    onChange(vacancies.map((v) => (v === target ? { ...v, ...patch } : v)));
  };

  const removeAt = (index) => {
    const targetList = tab === "open" ? openVacancies : closedVacancies;
    const target = targetList[index];
    onChange(vacancies.filter((v) => v !== target));
  };

  const addDraft = () => {
    if (!draft?.position?.trim()) return;
    onChange([...vacancies, { ...draft }]);
    setDraft(null);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* hidden field so this participates in the surrounding <Form> the
          same way other fields do, if Form reads inputs by name */}
      <input type="hidden" name={name} value={JSON.stringify(vacancies)} readOnly />

      {/* Tabs + add button: wrap on narrow screens */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-sm bg-gray-100 p-1">
          {[
            { key: "open", label: `Open (${openVacancies.length})` },
            { key: "history", label: `History (${closedVacancies.length})` },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!readOnly && tab === "open" && (
          <button
            type="button"
            onClick={() => setDraft(emptyDraft())}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-gray-900 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-900 hover:text-white sm:w-auto sm:py-1.5"
          >
            <Plus size={14} />
            Add vacancy
          </button>
        )}
      </div>

      {/* Draft form: stacked on mobile, one row from sm */}
      {draft && (
        <div className="flex flex-col gap-3 rounded-sm border border-gray-300 bg-gray-50 p-3 sm:flex-row sm:items-end">
          <div className="w-full min-w-0 sm:flex-1">
            <Input
              label="Position"
              value={draft.position}
              onChange={(e) => setDraft({ ...draft, position: e.target.value })}
              placeholder="Job title"
              autoFocus
            />
          </div>
          <div className="w-full sm:w-28">
            <Input
              label="Openings"
              type="number"
              min={0}
              value={draft.openings}
              onChange={(e) => setDraft({ ...draft, openings: Number(e.target.value) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={addDraft}
              className="rounded-sm bg-black px-3 py-2.5 text-sm font-medium text-white hover:bg-gray-800 sm:py-2"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-sm border border-gray-200 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-100 sm:border-0 sm:py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {visible.length === 0 && !draft && (
        <p className="py-6 text-center text-sm text-gray-400">
          {tab === "open" ? "No open vacancies" : "No closed vacancies yet"}
        </p>
      )}

      {visible.length > 0 && (
        <div className="flex flex-col divide-y divide-gray-100 rounded-sm border border-gray-200">
          {visible.map((v, i) => (
            <div
              key={v.code ?? `new-${i}`}
              className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start sm:px-4"
            >
              {/* Position: full width on mobile */}
              <div className="w-full min-w-0 sm:flex-1">
                <Input
                  label="Position"
                  placeholder="Position"
                  value={v.position}
                  onChange={(e) => updateAt(i, { position: e.target.value })}
                  readOnly={readOnly}
                />
                {v.code && (
                  <span className="mt-1 block text-xs text-gray-400">Code: {v.code}</span>
                )}
              </div>

              {/* Openings + Status share a row on mobile; on sm+ `contents`
                  makes them direct flex children again with fixed widths */}
              <div className="grid grid-cols-2 gap-3 sm:contents">
                <div className="min-w-0 sm:w-24">
                  <Input
                    label="Openings"
                    placeholder="Openings"
                    type="number"
                    min={0}
                    value={v.openings}
                    onChange={(e) => updateAt(i, { openings: Number(e.target.value) })}
                    readOnly={readOnly}
                  />
                </div>

                <div className="min-w-0 sm:w-32">
                  <Select
                    label="Status"
                    placeholder="Status"
                    value={v.status}
                    onChange={(e) => updateAt(i, { status: e.target.value })}
                    disabled={readOnly}
                    readOnly={readOnly}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="flex items-center justify-center gap-1.5 self-end rounded-sm p-1.5 text-sm text-gray-400 hover:text-black sm:self-center"
                  title="Remove vacancy"
                >
                  <Trash2 size={16} />
                  <span className="sm:hidden">Remove</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

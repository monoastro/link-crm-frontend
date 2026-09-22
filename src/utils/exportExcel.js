// utils/exportExcel.js
import * as XLSX from "xlsx";

/**
 * candidates: array of full candidate objects (from the bucket)
 * fields: array of { key, label } — already filtered to the checked ones
 * getValue(candidate, field) lets you resolve relations/dates per field
 */
export function exportCandidatesToExcel(candidates, fields, filename = "candidates-export.xlsx") {
  const rows = candidates.map((candidate) => {
    const row = {};
    fields.forEach((field) => {
      row[field.label] = resolveExportValue(candidate, field);
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns roughly based on content length
  const colWidths = fields.map((field) => {
    const longest = rows.reduce((max, row) => {
      const val = row[field.label] ? String(row[field.label]) : "";
      return Math.max(max, val.length);
    }, field.label.length);
    return { wch: Math.min(Math.max(longest + 2, 10), 40) };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidates");
  XLSX.writeFile(wb, filename);
}

function resolveExportValue(candidate, field) {
  const raw = candidate[field.key];

  if (field.key === "companyId") {
    if (raw == null) return "";
    return typeof raw === "string" ? raw : raw.name ?? raw.id ?? "";
  }

  if (["dob", "visaReceivedDate", "visaExpiryDate", "deploymentOn"].includes(field.key)) {
    if (!raw) return "";
    return new Date(raw).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (raw == null) return "";
  return typeof raw === "object" ? JSON.stringify(raw) : raw;
}

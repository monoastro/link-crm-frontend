"use client";

import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useApi, useToast } from "@/packages/admin";
import { getRuntimeConfig } from "@/packages/admin/lib/runtime.config.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function display(value, fallback = "—") {
  return value === null || value === undefined || value === ""
    ? fallback
    : escapeHtml(value);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function absoluteUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const host = getRuntimeConfig().host || window.location.origin;
  return `${host.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

function field(label, value) {
  return `<div class="detail"><span>${escapeHtml(label)}</span><strong>${display(value)}</strong></div>`;
}

function list(items) {
  const values = items.filter(Boolean);
  return values.length
    ? `<ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p class="muted">No information provided.</p>`;
}

function candidatePage(candidate, fallback) {
  const source = { ...fallback, ...candidate };
  const photo = source.documents?.find((document) => document.type === "photo");
  const photoMarkup = photo?.url
    ? `<img class="photo" src="${escapeHtml(absoluteUrl(photo.url))}" alt="Candidate photograph" />`
    : `<div class="photo placeholder">Photo</div>`;

  const position = source.appliedCategoryName || source.visaProfession || source.appliedCategory;
  const contact = [source.phone, source.email, source.address].filter(Boolean);
  const statuses = [
    source.appliedCountry && `Applied country: ${source.appliedCountry}`,
    source.month && `Month: ${source.month}`,
    source.company?.name && `Company: ${source.company.name}`,
    source.visaStatus && `Visa status: ${source.visaStatus}`,
  ];

  return `
    <section class="cv-page">
      <aside>
        ${photoMarkup}
        <div class="side-section">
          <h2>Contact</h2>
          ${list(contact)}
        </div>
        <div class="side-section">
          <h2>Personal Details</h2>
          ${field("Date of birth", formatDate(source.dob))}
          ${field("Place of birth", source.placeOfBirth)}
          ${field("Gender", source.gender)}
          ${field("Nationality", source.appliedCountry)}
        </div>
        <div class="side-section">
          <h2>Passport</h2>
          ${field("Passport number", source.passportNumber)}
          ${field("Expiry", formatDate(source.passportExpiry))}
          ${field("Physical passport", source.ppStatus)}
        </div>
      </aside>

      <main>
        <div class="heading">
          <div>
            <p class="eyebrow">Curriculum Vitae</p>
            <h1>${display(source.name, "Candidate")}</h1>
            <p class="position">${display(position, "Professional candidate")}</p>
          </div>
          <div class="heading-rule"></div>
        </div>

        <section class="content-section">
          <h2>Professional Summary</h2>
          <p>
            Motivated and reliable professional applying for the position of
            <strong> ${display(position, "the advertised role")}</strong>.
            This profile was prepared from the candidate information stored in the CRM.
          </p>
        </section>

        <section class="content-section">
          <h2>Application Details</h2>
          ${list(statuses)}
        </section>

        <section class="content-section">
          <h2>Additional Information</h2>
          ${field("Reference", source.reference)}
          ${field("Medical status", source.medicalStatus)}
          ${field("Flight status", source.flightStatus)}
          ${field("Remarks", source.remarks)}
        </section>

        <section class="content-section declaration">
          <h2>Declaration</h2>
          <p>I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.</p>
          <div class="signature-row"><span>Date: ____________________</span><span>Signature: ____________________</span></div>
        </section>
      </main>
    </section>
  `;
}

function buildDocument(candidates) {
  const pages = candidates.map((candidate) => candidatePage(candidate, candidate)).join("");
  return `<!doctype html>
    <html><head><meta charset="utf-8" /><title>Candidate CVs</title>
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #e5e7eb; color: #172b4d; font: 12px Arial, sans-serif; }
      .cv-page { display: grid; grid-template-columns: 31% 69%; width: 210mm; min-height: 297mm; margin: 0 auto 16px; background: #fff; page-break-after: always; }
      .cv-page:last-child { page-break-after: auto; }
      aside { padding: 22mm 9mm 16mm; background: #eff5fc; color: #163b67; }
      main { padding: 18mm 13mm 16mm; }
      .photo { display: block; width: 42mm; height: 52mm; margin: 0 auto 12mm; border: 1px solid #b8c8da; border-radius: 2mm; object-fit: cover; background: #fff; }
      .placeholder { display: flex; align-items: center; justify-content: center; color: #8da2b8; font-size: 11px; }
      h1 { margin: 2mm 0 1mm; color: #101828; font-size: 29px; letter-spacing: .5px; text-transform: uppercase; }
      h2 { margin: 0 0 5mm; color: #174b7d; font-size: 15px; text-transform: uppercase; letter-spacing: .5px; }
      .side-section { padding: 0 0 7mm; margin-bottom: 7mm; border-bottom: 1px solid #b8c8da; }
      .side-section h2 { font-size: 12px; margin-bottom: 3mm; }
      ul { margin: 0; padding-left: 17px; color: #334e68; line-height: 1.55; }
      .muted { color: #718096; font-style: italic; }
      .detail { display: grid; grid-template-columns: 36% 64%; gap: 2mm; margin: 2mm 0; line-height: 1.35; }
      .detail span { color: #607d9a; }
      .detail strong { color: #243b53; font-weight: 600; overflow-wrap: anywhere; }
      .eyebrow { margin: 0; color: #1769aa; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
      .position { display: inline-block; margin: 2mm 0 0; padding: 2mm 4mm; background: #174b7d; color: white; font-weight: 700; text-transform: uppercase; }
      .heading { padding-bottom: 8mm; border-bottom: 2px solid #174b7d; }
      .heading-rule { width: 35mm; margin-top: 8mm; border-top: 5px solid #42a5f5; }
      .content-section { padding: 8mm 0; border-bottom: 1px solid #d4e0eb; }
      .content-section h2 { display: flex; align-items: center; gap: 4mm; }
      .content-section h2::before { content: ""; display: inline-block; width: 8mm; height: 8mm; border-radius: 50%; background: #174b7d; }
      .content-section p { margin: 0; color: #334e68; line-height: 1.65; }
      .declaration { border-bottom: 0; }
      .signature-row { display: flex; justify-content: space-between; margin-top: 14mm; color: #334e68; }
      @media print { body { background: #fff; } .cv-page { margin: 0; } }
    </style></head><body>${pages}</body></html>`;
}

export default function CandidateCvExportButton({ candidates }) {
  const { get } = useApi();
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    if (!candidates.length || isExporting) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error(new Error("Please allow pop-ups to export CVs."));
      return;
    }

    setIsExporting(true);
    printWindow.document.write("<p style='font-family:Arial;padding:24px'>Preparing CV…</p>");
    try {
      const responses = await Promise.all(candidates.map((candidate) => get(`/candidates/${candidate.id}`)));
      const fullCandidates = responses.map((response, index) => ({
        ...(response?.item ?? candidates[index]),
        ...candidates[index],
        ...(response?.item ?? {}),
      }));
      printWindow.document.open();
      printWindow.document.write(buildDocument(fullCandidates));
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 700);
    } catch (error) {
      printWindow.close();
      toast.error(error);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
      {isExporting ? "Preparing…" : "Export CV"}
    </button>
  );
}

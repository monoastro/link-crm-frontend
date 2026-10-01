// src/app/candidates/[id]/page.js
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, Loader2, Pencil } from "lucide-react";
import {
  AdminLayout,
  Form,
  useGet,
  resolveUrl,
} from "@/packages/admin";
import { PhotoUpload } from "@/components/templates/PhotoUpload.jsx";
import { CandidateDocumentsField } from "@/components/templates/CandidateDocumentsField.jsx";

const CARD = "rounded-sm border border-gray-200 bg-white p-3 sm:p-6";

// Visas expiring within this many days (or already expired) get the red treatment
const EXPIRY_WARN_DAYS = 7;

export default function CandidateDetailsPage() {
  const { id } = useParams();
  const { data, isLoading } = useGet(`/candidates/${id}`);
  const candidate = data?.item;
  const photoUrl = candidate?.documents?.find((document) => document.type === "photo")?.url ?? null;

  if (isLoading || !candidate) {
    return (
      <AdminLayout title="Candidate">
        <Loader2 size={18} className="animate-spin text-gray-400" />
        Loading…
      </AdminLayout>
    );
  }

  const expiry = expiryInfo(candidate.visaExpiryDate);

  return (
    <AdminLayout title={candidate.name ?? "Candidate"}>
      <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Visa expiry alert, sits on the same line as the Edit button */}
          {expiry?.urgent ? (
            <div
              role="alert"
              className="flex min-w-0 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <AlertTriangle size={15} className="shrink-0" />
              <span className="min-w-0 truncate">
                <span className="font-medium">
                  {expiry.days < 0
                    ? "Visa expired"
                    : expiry.days === 0
                    ? "Visa expires today"
                    : "Visa expiring soon"}
                </span>
                <span className="text-red-600"> · {expiry.label}</span>
              </span>
            </div>
          ) : (
            <span />
          )}

          <Link
            href={`/candidates/${id}/edit`}
            className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:w-auto sm:py-2"
          >
            <Pencil size={15} />
            Edit Candidate
          </Link>
        </div>

        {/* Identity: photo on top (centered) on mobile, beside the fields from sm */}
        <section className={`flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6 ${CARD}`}>
          <PhotoUpload
            existingUrl={resolveUrl({ url: photoUrl })}
            file={null}
            onChange={() => {}}
            readOnly
          />
          <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
            <ReadRow>
              <ReadField label="Full name" value={candidate.name} />
              <ReadField label="Passport number" value={candidate.passportNumber} />
              <ReadField label="Physical passport" value={candidate.ppStatus} />
            </ReadRow>
            <ReadRow>
              <ReadField label="Email" value={candidate.email} />
              <ReadField label="Phone" value={candidate.phone} />
            </ReadRow>
            <ReadRow>
              <ReadField label="Gender" value={candidate.gender} />
              <ReadField label="Date of birth" value={formatDate(candidate.dob)} />
              <ReadField label="Place of birth" value={candidate.placeOfBirth} />
            </ReadRow>
            <ReadRow>
              <ReadField label="Passport expiry" value={formatDate(candidate.passportExpiry)} />
              <ReadField label="Address" value={candidate.address} />
            </ReadRow>
          </div>
        </section>

        <ReadSection title="Application Details">
          <ReadRow>
            <ReadField label="Applied country" value={candidate.appliedCountry} />
            <ReadField
              label="Applied category"
              value={candidate.vacancy?.position ?? candidate.appliedCategoryName}
            />
            <ReadField label="Month" value={candidate.month} />
          </ReadRow>
          <ReadRow>
            <ReadField label="Company" value={candidate.company?.name ?? candidate.companyName} />
            <ReadField label="Reference" value={candidate.reference} />
            <ReadField label="Offer status" value={candidate.offerStatus} />
            <ReadField label="Selected" value={candidate.isSelected ? "Yes" : "No"} />
          </ReadRow>
          <ReadRow>
            <ReadField
              label="Docs forward / interview date"
              value={formatDate(candidate.docsForwardOrInterviewDate)}
            />
          </ReadRow>
          <ReadField label="Remarks" value={candidate.remarks} multiline />
        </ReadSection>

        <ReadSection title="Visa Details" urgent={expiry?.urgent}>
          <ReadRow>
            <ReadField label="Visa number" value={candidate.visaNumber} />
            <ReadField label="Visa status" value={candidate.visaStatus} />
            <ReadField label="Visa profession" value={candidate.visaProfession} />
          </ReadRow>
          <ReadRow>
            <ReadField label="Visa received date" value={formatDate(candidate.visaReceivedDate)} />
            <ReadField
              label="Visa expiry date"
              value={formatDate(candidate.visaExpiryDate)}
              urgent={expiry?.urgent}
              hint={expiry?.label}
            />
          </ReadRow>
          <ReadRow>
            <ReadField label="QVC status" value={candidate.qvcStatus} />
            <ReadField label="MOFA status" value={candidate.mofaStatus} />
            <ReadField label="DOFE status" value={candidate.dofeStatus} />
          </ReadRow>
          <ReadRow>
            <ReadField label="MOL status" value={candidate.molStatus} />
            <ReadField label="Tashreeh status" value={candidate.tashreehStatus} />
          </ReadRow>
          <ReadField label="Visa remarks" value={candidate.visaRemarks} multiline />
        </ReadSection>

        <ReadSection title="Medical and Deployment Details">
          <ReadRow>
            <ReadField label="Medical status" value={candidate.medicalStatus} />
            <ReadField label="PCC status" value={candidate.pccStatus} />
            <ReadField label="Flight status" value={candidate.flightStatus} />
          </ReadRow>
          <ReadRow>
            <ReadField label="Deployment date" value={formatDate(candidate.deploymentOn)} />
          </ReadRow>
        </ReadSection>

        <section className={`min-w-0 ${CARD}`}>
          <Form defaults={candidate} onSubmit={() => {}}>
            <CandidateDocumentsField name="documents" caption="Documents" readOnly />
          </Form>
        </section>
      </div>
    </AdminLayout>
  );
}

function ReadSection({ title, urgent = false, children }) {
  return (
    <section
      className={`flex min-w-0 flex-col gap-4 rounded-sm border p-3 sm:p-6 ${
        urgent ? "border-red-200 bg-red-50/40" : "border-gray-200 bg-white"
      }`}
    >
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

// 2 columns on mobile, wrapping flex row from sm
function ReadRow({ children }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:flex sm:flex-wrap sm:gap-4">
      {children}
    </div>
  );
}

function ReadField({ label, value, multiline = false, urgent = false, hint }) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-1 sm:flex-1 ${
        multiline ? "col-span-2 sm:basis-full" : ""
      }`}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span
        className={`text-sm ${urgent ? "font-medium text-red-700" : "text-gray-800"} ${
          multiline ? "whitespace-pre-wrap break-words" : "break-words sm:truncate"
        }`}
      >
        {value || "—"}
        {hint && (
          <span
            className={`ml-1.5 whitespace-nowrap text-[11px] font-normal ${
              urgent ? "text-red-600" : "text-gray-400"
            }`}
          >
            ({hint})
          </span>
        )}
      </span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Whole calendar days from today until the date (negative = already expired).
// Plain "YYYY-MM-DD" strings are read as local dates so the count isn't off by one.
function daysUntil(value) {
  if (!value) return null;

  let target;
  const match = typeof value === "string" && value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    target = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  } else {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

function expiryInfo(value) {
  const days = daysUntil(value);
  if (days == null) return null;

  const plural = (n) => `${n} day${n === 1 ? "" : "s"}`;
  let label;
  if (days < 0) label = `Expired ${plural(-days)} ago`;
  else if (days === 0) label = "Expires today";
  else label = `${plural(days)} left`;

  return { days, label, urgent: days <= EXPIRY_WARN_DAYS };
}

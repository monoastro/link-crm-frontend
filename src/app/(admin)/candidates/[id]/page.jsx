// src/app/candidates/[id]/page.js
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import {
  AdminLayout,
  Form,
  useGet,
  resolveUrl,
} from "@/packages/admin";
import { PhotoUpload } from "@/components/templates/PhotoUpload.jsx";
import { CandidateDocumentsField } from "@/components/templates/CandidateDocumentsField.jsx";

const CARD = "rounded-sm border border-gray-200 bg-white p-3 sm:p-6";

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

  return (
    <AdminLayout title={candidate.name ?? "Candidate"}>
      <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
        <div className="flex sm:justify-end">
          <Link
            href={`/candidates/${id}/edit`}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:w-auto sm:py-2"
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

        <ReadSection title="Visa Details">
          <ReadRow>
            <ReadField label="Visa number" value={candidate.visaNumber} />
            <ReadField label="Visa status" value={candidate.visaStatus} />
            <ReadField label="Visa profession" value={candidate.visaProfession} />
          </ReadRow>
          <ReadRow>
            <ReadField label="Visa received date" value={formatDate(candidate.visaReceivedDate)} />
            <ReadField label="Visa expiry date" value={formatDate(candidate.visaExpiryDate)} />
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

function ReadSection({ title, children }) {
  return (
    <section className={`flex min-w-0 flex-col gap-4 ${CARD}`}>
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

// 2 columns on mobile, wrapping flex row from sm (same as before)
function ReadRow({ children }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:flex sm:flex-wrap sm:gap-4">
      {children}
    </div>
  );
}

function ReadField({ label, value, multiline = false }) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-1 sm:flex-1 ${
        multiline ? "col-span-2 sm:basis-full" : ""
      }`}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      {/* Wrap on mobile so long emails/addresses stay readable; truncate on sm+ as before */}
      <span
        className={`text-sm text-gray-800 ${
          multiline ? "whitespace-pre-wrap break-words" : "break-words sm:truncate"
        }`}
      >
        {value || "—"}
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

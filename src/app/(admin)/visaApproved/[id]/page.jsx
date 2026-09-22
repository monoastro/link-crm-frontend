// src/app/visa-approved/[id]/page.js
"use client";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  AdminLayout,
  removeEmptyFields,
  useApi,
  useGet,
  useToast,
} from "@/packages/admin";
import { Input, Select, Form } from "@/packages/admin";
import { RelationshipField, resolveUrl } from "@/packages/admin";
import { PhotoUpload } from "@/components/templates/PhotoUpload.jsx";
import Link from "next/link";

const GENDER_OPTIONS = ["male", "female", "other"];
const FLIGHT_STATUS_OPTIONS = ["pending", "scheduled", "deployed"];

export default function VisaApprovedDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { patch } = useApi();

  const apiPath = "/candidates";
  const { data, loading } = useGet(`${apiPath}/${id}`);
  const candidate = data?.item;
  const existingPhotoUrl = candidate?.documents?.find((i) => i.type === "photo")?.url ?? null;

  if (loading || !candidate) {
    return (
      <AdminLayout title="Visa Approved">
        <Loader2 size={18} className="animate-spin text-gray-400" />
        Loading…
      </AdminLayout>
    );
  }

  const DEPLOYMENT_FIELDS = ["flightStatus", "deploymentOn"];

  async function handleSubmit(values) {
    const scoped = Object.fromEntries(
      Object.entries(values).filter(([key]) => DEPLOYMENT_FIELDS.includes(key))
    );
    const clean = removeEmptyFields(scoped);

    const res = await patch(`${apiPath}/${id}`, clean);
    if (res?.ok) {
      toast.success("Deployment details updated");
      router.refresh?.();
    }
    return res;
  }

  return (
    <AdminLayout title={candidate.name ?? "Candidate"}>
      <div className="flex flex-col gap-6">

        {/* Identity — read only */}
        <div className="flex gap-6 rounded-sm border border-gray-200 bg-white p-6">
          <PhotoUpload
            existingUrl={resolveUrl({ url: existingPhotoUrl })}
            file={null}
            onChange={() => {}}
            readOnly
          />

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex gap-4">
              <ReadField label="Full name" value={candidate.name} />
              <ReadField label="Passport number" value={candidate.passportNumber} />
            </div>
            <div className="flex gap-4">
              <ReadField label="Email" value={candidate.email} />
              <ReadField label="Phone" value={candidate.phone} />
            </div>
            <div className="flex gap-4">
              <ReadField label="Gender" value={candidate.gender} />
              <ReadField label="Date of birth" value={formatDate(candidate.dob)} />
              <ReadField label="Place of birth" value={candidate.placeOfBirth} />
            </div>
            <ReadField label="Address" value={candidate.address} />
          </div>
        </div>

        {/* Visa — read only */}
        <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900">Visa Details</h3>
          <div className="flex gap-4">
            <ReadField label="Visa number" value={candidate.visaNumber} />
            <ReadField label="Visa status" value={candidate.visaStatus} />
            <ReadField label="Visa profession" value={candidate.visaProfession} />
          </div>
          <div className="flex gap-4">
            <ReadField label="Visa received date" value={formatDate(candidate.visaReceivedDate)} />
            <ReadField label="Visa expiry date" value={formatDate(candidate.visaExpiryDate)} />
          </div>
          <div className="flex gap-4">
            <ReadField label="QVC status" value={candidate.qvcStatus} />
            <ReadField label="MOFA status" value={candidate.mofaStatus} />
          </div>
          <div className="flex gap-4">
            <ReadField label="Applied country" value={candidate.appliedCountry} />
            <ReadField label="Applied category" value={candidate.appliedCategory} />
          </div>
        </div>

        {/* Deployment — editable */}
        <div className="rounded-sm border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Deployment Details</h3>
          <Form
            defaults={candidate}
            id="deployment-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div className="flex gap-4">
              <Select name="flightStatus" placeholder="Flight status">
                {FLIGHT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
              <Input name="deploymentOn" type="date" placeholder="Deployment date" />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Save Deployment Details
              </button>
            </div>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
}

function ReadField({ label, value }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="truncate text-sm text-gray-800">{value || "—"}</span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

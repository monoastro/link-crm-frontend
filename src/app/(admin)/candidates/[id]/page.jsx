// src/app/candidates/[id]/page.js
"use client";

import { useParams, useRouter } from "next/navigation";
import {
  AdminLayout,
  removeEmptyFields,
  useApi,
  useGet,
  useToast,
  useAuth,
} from "@/packages/admin";
import { Loader2 } from "lucide-react";
import { Input, Select, Textarea, Form } from "@/packages/admin";
import { CandidateDocumentsField } from "@/components/templates/CandidateDocumentsField.jsx";
import { DOCUMENT_TYPES } from "@/components/templates/CandidateDocumentsField.jsx";
// or duplicate the list here if it's not exported yet

const DOCUMENT_TYPE_VALUES = DOCUMENT_TYPES.map((t) => t.value);
const DOCUMENT_TYPE_EXISTING_KEYS = DOCUMENT_TYPE_VALUES.map((t) => `${t}_existing`);

const SECTION_FIELDS = {
  application: [
    "appliedCountry", "appliedCategory", "month",
    "companyId", "reference", "remarks",
  ],
  visa: [
    "visaNumber", "visaStatus", "visaProfession",
    "visaReceivedDate", "visaExpiryDate", "qvcStatus", "mofaStatus",
  ],
  flight: ["flightStatus", "deploymentOn"],
  medical: ["medicalStatus", "pccStatus"],
  documents: [...DOCUMENT_TYPE_VALUES, ...DOCUMENT_TYPE_EXISTING_KEYS],
};

// ---------------------------------------------------------------------------
// Role config
// ---------------------------------------------------------------------------

const ROLES = {
  ADMIN: "admin",
  FRONT_DESK: "frontdesk",
  FLIGHT: "flight",
  VISA: "visa",
  MEDICAL: "medical",
};

// Which role "owns" each section. Admin can always see + edit everything.
// Front desk fields (identity) are visible to everyone regardless of role.
const SECTION_OWNERS = {
  application: ROLES.FRONT_DESK,
  visa: ROLES.VISA,
  flight: ROLES.FLIGHT,
  medical: ROLES.MEDICAL,
  documents: ROLES.FRONT_DESK,
};


const GENDER_OPTIONS = ["male", "female", "other"];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CandidateEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { post, patch } = useApi();
  const { user } = useAuth();

  const isNew = id === "new";
  const apiPath = "/candidates";
  const { data, loading } = useGet(isNew ? null : `${apiPath}/${id}`);

  const role = user?.role ?? ROLES.FRONT_DESK;
  const isAdmin = role === ROLES.ADMIN;

  // Section visible if admin, or if this role owns the section
  const canView = (section) => isAdmin || role === SECTION_OWNERS[section];
  // Section editable if admin, or if this role owns the section
  // (front desk / owning role can always edit their own section fully;
  // admin can edit everything)
  const canEdit = (section) => isAdmin || role === SECTION_OWNERS[section];
  const ro = (section) => !canEdit(section);

  if (!isNew && loading) {
    return (
      <AdminLayout title="Candidate">
        <Loader2 size={18} className="animate-spin text-gray-400" />
        Loading…
      </AdminLayout>
    );
  }

  async function handleSubmit(values) {
    // only keep fields belonging to sections this role can edit
    const allowedFields = Object.entries(SECTION_FIELDS)
      .filter(([section]) => canEdit(section))
      .flatMap(([, fields]) => fields);

    // identity fields are always editable by everyone who can see them
    // (front desk owns identity — adjust if admin-only editing is desired)
    const identityFields = [
      "name", "email", "phone", "passportNumber", "address",
      "dob", "gender", "placeOfBirth",
    ];
    if (isAdmin || role === ROLES.FRONT_DESK) {
      allowedFields.push(...identityFields);
    }

    const scoped = Object.fromEntries(
      Object.entries(values).filter(([key]) => allowedFields.includes(key))
    );
    const clean = removeEmptyFields(scoped);
    const payload = new FormData()
    Object.entries(clean).forEach(([k, v]) => payload.append(k, v))

    const url = isNew ? apiPath : `${apiPath}/${id}`;
    const res = isNew ? await post(url, payload) : await patch(url, payload);

    if (res?.ok) {
      toast.success(`Candidate ${isNew ? "created" : "updated"} successfully`);
      router.replace("/candidates");
    }
    return res;
  }

  const identityReadOnly = !(isAdmin || role === ROLES.FRONT_DESK);

  return (
    <AdminLayout title={`${isNew ? "New" : "Edit"} Candidate`} formId="candidate-form">
      <Form
        defaults={data?.item ?? {}}
        id="candidate-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        {/* Identity — visible to everyone, editable by front desk / admin only */}
        <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
          <div className="flex gap-4">
            <Input name="name" placeholder="Full name" required readOnly={identityReadOnly} />
            <Input name="passportNumber" placeholder="Passport number" required readOnly={identityReadOnly} />
          </div>
          <div className="flex gap-4">
            <Input name="email" type="email" placeholder="Email" readOnly={identityReadOnly} />
            <Input name="phone" placeholder="Phone" readOnly={identityReadOnly} />
          </div>
          <div className="flex gap-4">
            <Select name="gender" placeholder="Gender" disabled={identityReadOnly} readOnly={identityReadOnly}>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
            <Input name="dob" type="date" placeholder="Date of birth" readOnly={identityReadOnly} />
            <Input name="placeOfBirth" placeholder="Place of birth" readOnly={identityReadOnly} />
          </div>
          <Input name="address" placeholder="Address" readOnly={identityReadOnly} />
        </div>

        {/* Application details — only front desk / admin see this */}
        {canView("application") && (
          <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
            <div className="flex gap-4">
              <Input name="appliedCountry" placeholder="Applied country" readOnly={ro("application")} />
              <Input name="appliedCategory" placeholder="Applied category" readOnly={ro("application")} />
              <Input name="month" placeholder="Month" readOnly={ro("application")} />
            </div>
            <div className="flex gap-4">
              <Input name="companyId" placeholder="Company ID" readOnly={ro("application")} />
              <Input name="reference" placeholder="Reference" readOnly={ro("application")} />
            </div>
            <Textarea name="remarks" placeholder="Remarks" readOnly={ro("application")} />
          </div>
        )}

        {/* Visa — only visa / admin see this */}
        {canView("visa") && (
          <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
            <div className="flex gap-4">
              <Input name="visaNumber" placeholder="Visa number" readOnly={ro("visa")} />
              <Input name="visaStatus" placeholder="Visa status" readOnly={ro("visa")} />
              <Input name="visaProfession" placeholder="Visa profession" readOnly={ro("visa")} />
            </div>
            <div className="flex gap-4">
              <Input name="visaReceivedDate" type="date" placeholder="Visa received date" readOnly={ro("visa")} />
              <Input name="visaExpiryDate" type="date" placeholder="Visa expiry date" readOnly={ro("visa")} />
            </div>
            <div className="flex gap-4">
              <Input name="qvcStatus" placeholder="QVC status" readOnly={ro("visa")} />
              <Input name="mofaStatus" placeholder="MOFA status" readOnly={ro("visa")} />
            </div>
          </div>
        )}

        {/* Flight — only flight / admin see this */}
        {canView("flight") && (
          <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
            <div className="flex gap-4">
              <Input name="deploymentOn" type="date" placeholder="Deployment date" readOnly={ro("flight")} />
              <Input name="flightStatus" placeholder="Flight status" readOnly={ro("flight")} />
            </div>
          </div>
        )}

        {/* Medical — only medical / admin see this */}
        {canView("medical") && (
          <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
            <div className="flex gap-4">
              <Input name="medicalStatus" placeholder="Medical status" readOnly={ro("medical")} />
              <Input name="pccStatus" placeholder="PCC status" readOnly={ro("medical")} />
            </div>
          </div>
        )}

        {/* Documents — only front desk / admin see this */}
        {canView("documents") && (
          <div className="rounded-sm border border-gray-200 bg-white p-6">
            <CandidateDocumentsField
              name="documents"
              caption="Documents"
              readOnly={ro("documents")}
            />
          </div>
        )}
      </Form>
    </AdminLayout>
  );
}

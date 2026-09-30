// src/app/candidates/[id]/edit/page.js
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  AdminLayout,
  removeEmptyFields,
  useApi,
  useGet,
  useToast,
  useAuth,
  SearchableSelect,
  RelationshipField,
  resolveUrl,
} from "@/packages/admin";
import { Input, Textarea, Form } from "@/packages/admin";
import { CandidateDocumentsField } from "@/components/templates/CandidateDocumentsField.jsx";
import { PhotoUpload } from "@/components/templates/PhotoUpload.jsx";
import { countries } from "@/app/(admin)/_entities/countries";

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

const SECTION_OWNERS = {
  application: ROLES.FRONT_DESK,
  visa: ROLES.VISA,
  flight: ROLES.FLIGHT,
  medical: ROLES.MEDICAL,
  documents: ROLES.FRONT_DESK,
};

const SECTION_FIELDS = {
  application: [
    "appliedCountry", "appliedCategory", "month",
    "companyId", "reference", "remarks", "isSelected",
  ],
  visa: [
    "visaNumber", "visaStatus", "visaProfession", "visaRemarks",
    "visaReceivedDate", "visaExpiryDate", "qvcStatus", "mofaStatus",
  ],
  flight: ["flightStatus", "deploymentOn"],
  medical: ["medicalStatus", "pccStatus"],
  documents: ["documents"],
};

const GENDER_OPTIONS = ["male", "female", "other"];
const APPLIED_COUNTRY_OPTIONS = countries.map(({ label }) => ({
  value: label,
  label,
}));
const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const VISA_STATUS_OPTIONS = ["Waiting", "Received", "Rejected"];
const QVC_STATUS_OPTIONS = ["Cleared", "Pending", "Revisit Required", "Unfit"];
const MOFA_STATUS_OPTIONS = ["Pending", "Attested", "Rejected"];
const FLIGHT_STATUS_OPTIONS = ["Not flown", "Flown"];
const MEDICAL_STATUS_OPTIONS = ["Fit", "Unfit", "Pending"];
const PCC_STATUS_OPTIONS = ["Pending", "Received"];

function SelectedStatusField({ defaultValue, readOnly }) {
  const [selectedValue, setSelectedValue] = useState(Boolean(defaultValue));

  return (
    <fieldset className="flex min-w-[260px] flex-1 flex-col gap-1.5">
      <legend className="text-sm font-medium text-gray-700">Selected</legend>
      <input type="hidden" name="isSelected" value={String(selectedValue)} />
      <div className="flex gap-3 pt-1">
        {[
          { label: "Yes", value: true },
          { label: "No", value: false },
        ].map(({ label, value }) => (
          <label
            key={label}
            className={`flex flex-1 items-center gap-2 whitespace-nowrap rounded-sm border px-3 py-2 text-sm capitalize transition-colors ${
              selectedValue === value
                ? "border-black bg-gray-100 text-black"
                : "border-gray-200 text-gray-700"
            } ${readOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-50"}`}
          >
            <input
              type="radio"
              name="isSelectedRadio"
              value={label}
              checked={selectedValue === value}
              onChange={() => setSelectedValue(value)}
              disabled={readOnly}
              className="h-4 w-4 accent-black"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PassportStatusField({ defaultValue, readOnly }) {
  const [selectedValue, setSelectedValue] = useState(String(defaultValue ?? "").toLowerCase());

  return (
    <fieldset className="flex min-w-[260px] flex-1 flex-col gap-1.5">
      <legend className="text-sm font-medium text-gray-700">Physical passport</legend>
      <div className="flex gap-3 pt-1">
        {["present", "not present"].map((value) => (
          <label
            key={value}
            className={`flex flex-1 items-center gap-2 whitespace-nowrap rounded-sm border px-3 py-2 text-sm capitalize transition-colors ${
              selectedValue === value
                ? "border-blue-500 bg-blue-50 text-blue-800"
                : "border-gray-200 text-gray-700"
            } ${readOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-50"}`}
          >
            <input
              type="radio"
              name="ppStatus"
              value={value}
              checked={selectedValue === value}
              onChange={() => setSelectedValue(value)}
              disabled={readOnly}
              className="h-4 w-4 accent-blue-600"
            />
            {value}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CandidateEditPage({ idOverride } = {}) {
  const { id: routeId } = useParams();
  const id = idOverride ?? routeId;
  const router = useRouter();
  const toast = useToast();
  const { post, patch } = useApi();
  const { user } = useAuth();

  const isNew = id === "new";
  const apiPath = "/candidates";
  const { data, isLoading: loading } = useGet(isNew ? null : `${apiPath}/${id}`);
  const [appliedCountryOverride, setAppliedCountryOverride] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  // Tracks whichever company is currently selected in the "companyId"
  // RelationshipField. Seeded from the loaded candidate on edit, but updates
  // live whenever the user picks a different company.
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const companyId = selectedCompanyId ?? data?.item?.companyId ?? null;

  // As soon as a company is selected (either from the loaded candidate or a
  // fresh pick), fetch that company's full record — including its
  // vacancies — so the "applied category" field can be populated from it.
  const { data: companyData, isLoading: companyLoading } = useGet(
    companyId ? `/companies/${companyId}` : null
  );

  const role = user?.role ?? ROLES.FRONT_DESK;
  const isAdmin = role === ROLES.ADMIN;

  const canView = (section) => isAdmin || role === SECTION_OWNERS[section];
  const canEdit = (section) => isAdmin || role === SECTION_OWNERS[section];
  const ro = (section) => !canEdit(section);

  const appliedCountry = appliedCountryOverride ?? data?.item?.appliedCountry ?? "";

  // Applied category options = the selected company's open vacancy
  // positions. Always keep the candidate's currently-saved category in the
  // list too, even if that vacancy has since closed, so editing an existing
  // candidate doesn't silently blank out their saved value.
  const vacancyPositions = (companyData?.item?.vacancies ?? [])
    .filter((v) => v.status === "open")
    .map((v) => ({ value: v.id, label: v.position }));

  // Both profession fields use the same company vacancy list, while their
  // selected values remain independent. Keep saved values available when a
  // vacancy has since closed or the saved values differ from one another.
  const professionOptions = Array.from(
    new Set([
      ...vacancyPositions,
    ].filter(Boolean)),
  );

  const isQatar = ["qatar", "qa"].includes(appliedCountry.toLowerCase());

  const identityReadOnly = !(isAdmin || role === ROLES.FRONT_DESK);
  const existingPhotoUrl = data?.item?.documents?.find((i) => i.type === "photo")?.url ?? null;

  if (!isNew && loading) {
    return (
      <AdminLayout title="Candidate">
        <Loader2 size={18} className="animate-spin text-gray-400" />
        Loading…
      </AdminLayout>
    );
  }

  async function handleSubmit(values) {
    const allowedFields = Object.entries(SECTION_FIELDS)
      .filter(([section]) => canEdit(section))
      .flatMap(([, fields]) => fields);

    const identityFields = [
      "name", "email", "phone", "passportNumber", "ppStatus", "address",
      "dob", "gender", "placeOfBirth",
    ];
    if (isAdmin || role === ROLES.FRONT_DESK) {
      allowedFields.push(...identityFields);
    }

    const scoped = Object.fromEntries(
      Object.entries(values).filter(([key]) => allowedFields.includes(key))
    );
    const clean = removeEmptyFields(scoped);
    if (photoFile && !identityReadOnly) clean.photo = photoFile;

    const payload = new FormData();
    Object.entries(clean).forEach(([k, v]) => payload.append(k, v));

    if (canEdit("documents")) {
      Object.entries(values).forEach(([key, val]) => {
        if (key.startsWith("other_existing_") && val) {
          payload.append("other_existing", val);
        } else if (key.startsWith("other_") && val instanceof File && val.size > 0) {
          payload.append("other", val);
        }
      });
    }

    const url = isNew ? apiPath : `${apiPath}/${id}`;
    const res = isNew ? await post(url, payload) : await patch(url, payload);

    if (res?.ok) {
      toast.success(`Candidate ${isNew ? "created" : "updated"} successfully`);
      router.replace("/candidates");
    }
    return res;
  }

  return (
    <AdminLayout title={`${isNew ? "New" : "Edit"} Candidate`} formId="candidate-form">
      <Form
        defaults={data?.item ?? {}}
        id="candidate-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        {/* Identity */}
        <div className="flex gap-6 rounded-sm border border-gray-200 bg-white p-6">
          <PhotoUpload
            existingUrl={resolveUrl({ url: existingPhotoUrl })}
            file={photoFile}
            onChange={setPhotoFile}
            readOnly={identityReadOnly}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex gap-4">
              <Input name="name" placeholder="Full name" required readOnly={identityReadOnly} />
              <Input name="passportNumber" placeholder="Passport number" required readOnly={identityReadOnly} />
              <PassportStatusField
                defaultValue={data?.item?.ppStatus}
                readOnly={identityReadOnly}
              />
            </div>
            <div className="flex gap-4">
              <Input name="email" type="email" placeholder="Email" readOnly={identityReadOnly} />
              <Input name="phone" placeholder="Phone" readOnly={identityReadOnly} />
            </div>
            <div className="flex gap-4">
              <SearchableSelect
                name="gender"
                label="Gender"
                options={GENDER_OPTIONS}
                disabled={identityReadOnly}
              />
              <Input name="dob" type="date" placeholder="Date of birth" readOnly={identityReadOnly} />
              <Input name="placeOfBirth" placeholder="Place of birth" readOnly={identityReadOnly} />
            </div>
            <Input name="address" placeholder="Address" readOnly={identityReadOnly} />
          </div>
        </div>

        {/* Application details */}
        {canView("application") && (
          <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
            <div className="flex gap-4">
              <SearchableSelect
                name="appliedCountry"
                label="Applied country"
                options={APPLIED_COUNTRY_OPTIONS}
                disabled={ro("application")}
                onChange={setAppliedCountryOverride}
              />

              <RelationshipField
                field={{
                  name: "companyId",
                  label: "Company",
                  relationTo: "companies",
                  labelField: "name",
                  valueField: "id",
                  searchable: true,
                }}
                readOnly={ro("application")}
                onChange={(value) => setSelectedCompanyId(value || null)}
              />

              <SearchableSelect
                name="month"
                label="Month"
                options={MONTH_OPTIONS}
                disabled={ro("application")}
              />
            </div>

            <div className="flex gap-4">
              {/* Applied category is enabled only once a company is chosen —
                  its options come from that company's open vacancies,
                  fetched as soon as companyId changes. */}
              <SearchableSelect
                key={companyId ?? "no-company"}
                name="appliedCategory"
                label="Applied category"
                options={professionOptions}
                disabled={ro("application") || !companyId || companyLoading}
                placeholder={
                  !companyId
                    ? "Select a company first"
                    : companyLoading
                    ? "Loading vacancies…"
                    : professionOptions.length
                    ? "Select applied category"
                    : "No open vacancies for this company"
                }
              />
              <Input name="reference" placeholder="Reference" readOnly={ro("application")} />
              <SelectedStatusField
                defaultValue={data?.item?.isSelected}
                readOnly={ro("application")}
              />
            </div>

            <Textarea name="remarks" placeholder="Remarks" readOnly={ro("application")} />
          </div>
        )}

        {/* Visa */}
        {canView("visa") && (
          <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
            <div className="flex gap-4">
              <Input name="visaNumber" placeholder="Visa number" readOnly={ro("visa")} />
              <SearchableSelect
                name="visaStatus"
                label="Visa status"
                options={VISA_STATUS_OPTIONS}
                disabled={ro("visa")}
              />
              <SearchableSelect
                name="visaProfession"
                label="Visa profession"
                options={professionOptions}
                disabled={ro("visa")}
              />
            </div>
            <div className="flex gap-4">
              <Input name="visaReceivedDate" type="date" placeholder="Visa received date" readOnly={ro("visa")} />
              <Input name="visaExpiryDate" type="date" placeholder="Visa expiry date" readOnly={ro("visa")} />
            </div>
            <div className="flex gap-4">
              {isQatar && (
                <SearchableSelect
                  name="qvcStatus"
                  label="QVC status"
                  options={QVC_STATUS_OPTIONS}
                  disabled={ro("visa")}
                />
              )}
              <SearchableSelect
                name="mofaStatus"
                label="MOFA status"
                options={MOFA_STATUS_OPTIONS}
                disabled={ro("visa")}
              />
            </div>
            <Textarea name="visaRemarks" placeholder="Visa remarks" readOnly={ro("visa")} />
          </div>
        )}

        {/* Flight */}
        {canView("flight") && (
          <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
            <div className="flex gap-4">
              <Input name="deploymentOn" type="date" placeholder="Deployment date" readOnly={ro("flight")} />
              <SearchableSelect
                name="flightStatus"
                label="Flight status"
                options={FLIGHT_STATUS_OPTIONS}
                disabled={ro("flight")}
              />
            </div>
          </div>
        )}

        {/* Medical */}
        {canView("medical") && (
          <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
            <div className="flex gap-4">
              <SearchableSelect
                name="medicalStatus"
                label="Medical status"
                options={MEDICAL_STATUS_OPTIONS}
                disabled={ro("medical")}
              />
              <SearchableSelect
                name="pccStatus"
                label="PCC status"
                options={PCC_STATUS_OPTIONS}
                disabled={ro("medical")}
              />
            </div>
          </div>
        )}

        {/* Documents */}
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

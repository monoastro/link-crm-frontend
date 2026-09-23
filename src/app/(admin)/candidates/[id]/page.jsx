// src/app/candidates/[id]/page.js
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AdminLayout,
  removeEmptyFields,
  useApi,
  useGet,
  useToast,
  useAuth,
  SearchableSelect,
} from "@/packages/admin";
import { Loader2 } from "lucide-react";
import { Input, Select, Textarea, Form } from "@/packages/admin";
import { CandidateDocumentsField } from "@/components/templates/CandidateDocumentsField.jsx";
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

// Which role "owns" each section. Admin can always see + edit everything.
// Front desk fields (identity) are visible to everyone regardless of role.
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
    "companyId", "reference", "remarks",
  ],
  visa: [
    "visaNumber", "visaStatus", "visaProfession",
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
const PROFESSION_OPTIONS = ["Cook", "Kitchen Helper"];
const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const VISA_STATUS_OPTIONS = ["Waiting", "Received", "Rejected"];
const QVC_STATUS_OPTIONS = ["Cleared", "Pending", "Revisit Required", "Unfit"];
const MOFA_STATUS_OPTIONS = ["Pending", "Attested", "Rejected"];
const FLIGHT_STATUS_OPTIONS = ["Not flown", "Flown"];
const MEDICAL_STATUS_OPTIONS = ["Fit", "Unfit", "Pending"];
const PCC_STATUS_OPTIONS = ["Pending", "Received"];

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

export default function CandidateEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { post, patch } = useApi();
  const { user } = useAuth();

  const isNew = id === "new";
  const apiPath = "/candidates";
  const { data, isLoading: loading } = useGet(isNew ? null : `${apiPath}/${id}`);
  const [appliedCountryOverride, setAppliedCountryOverride] = useState(null);
  const [customProfessionOptions, setCustomProfessionOptions] = useState([]);

  const role = user?.role ?? ROLES.FRONT_DESK;
  const isAdmin = role === ROLES.ADMIN;

  // Section visible if admin, or if this role owns the section
  const canView = (section) => isAdmin || role === SECTION_OWNERS[section];
  // Section editable if admin, or if this role owns the section
  // (front desk / owning role can always edit their own section fully;
  // admin can edit everything)
  const canEdit = (section) => isAdmin || role === SECTION_OWNERS[section];
  const ro = (section) => !canEdit(section);
  const { data: companiesData, isLoading: companiesLoading } = useGet(
    canView("application") ? "/companies?pageSize=200" : null,
  );
  const companies = companiesData?.items ?? [];
  const appliedCountry = appliedCountryOverride ?? data?.item?.appliedCountry ?? "";
  const professionOptions = Array.from(
    new Set([
      ...PROFESSION_OPTIONS,
      ...customProfessionOptions,
      data?.item?.appliedCategory,
      data?.item?.visaProfession,
    ].filter(Boolean)),
  );
  const isQatar = ["qatar", "qa"].includes(appliedCountry.toLowerCase());

  const addProfession = (profession) => {
    setCustomProfessionOptions((current) =>
      current.some((option) => option.toLowerCase() === profession.toLowerCase())
        ? current
        : [...current, profession],
    );
  };

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
      "name", "email", "phone", "passportNumber", "ppStatus", "address",
      "dob", "gender", "placeOfBirth",
    ];
    if (isAdmin || role === ROLES.FRONT_DESK) {
      allowedFields.push(...identityFields);
    }

    const scoped = Object.fromEntries(
      Object.entries(values).filter(([key]) => allowedFields.includes(key))
    );
    const payload = removeEmptyFields(scoped);

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
              <Select
                name="appliedCountry"
                placeholder="Applied country"
                disabled={ro("application")}
                onChange={(event) => setAppliedCountryOverride(event.target.value)}
              >
                {APPLIED_COUNTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <SearchableSelect
                name="appliedCategory"
                label="Applied category"
                options={professionOptions}
                allowAdd
                disabled={ro("application")}
                onAddOption={addProfession}
              />
              <Select name="month" placeholder="Month" disabled={ro("application")}>
                {MONTH_OPTIONS.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-4">
              <Select
                name="companyId"
                placeholder={companiesLoading ? "Loading companies..." : "Company"}
                disabled={ro("application") || companiesLoading}
              >
                <option value="">No company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
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
              <Select name="visaStatus" placeholder="Visa status" disabled={ro("visa")}>
                {VISA_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
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
                <Select name="qvcStatus" placeholder="QVC status" disabled={ro("visa")}>
                  {QVC_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              )}
              <Select name="mofaStatus" placeholder="MOFA status" disabled={ro("visa")}>
                {MOFA_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* Flight — only flight / admin see this */}
        {canView("flight") && (
          <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
            <div className="flex gap-4">
              <Input name="deploymentOn" type="date" placeholder="Deployment date" readOnly={ro("flight")} />
              <Select name="flightStatus" placeholder="Flight status" disabled={ro("flight")}>
                {FLIGHT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* Medical — only medical / admin see this */}
        {canView("medical") && (
          <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
            <div className="flex gap-4">
              <Select name="medicalStatus" placeholder="Medical status" disabled={ro("medical")}>
                {MEDICAL_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
              <Select name="pccStatus" placeholder="PCC status" disabled={ro("medical")}>
                {PCC_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
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

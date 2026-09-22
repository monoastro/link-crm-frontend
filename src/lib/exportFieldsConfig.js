// components/admin/exportFieldsConfig.js
// Grouped export field definitions — mirrors SECTION_FIELDS in the candidate page.
export const EXPORT_FIELD_GROUPS = [
  {
    group: "Identity",
    fields: [
      { key: "name", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "passportNumber", label: "Passport Number" },
      { key: "gender", label: "Gender" },
      { key: "dob", label: "Date of Birth" },
      { key: "placeOfBirth", label: "Place of Birth" },
      { key: "address", label: "Address" },
    ],
  },
  {
    group: "Application",
    fields: [
      { key: "appliedCountry", label: "Applied Country" },
      { key: "appliedCategory", label: "Applied Category" },
      { key: "month", label: "Month" },
      { key: "companyId", label: "Company" },
      { key: "reference", label: "Reference" },
      { key: "remarks", label: "Remarks" },
    ],
  },
  {
    group: "Visa",
    fields: [
      { key: "visaNumber", label: "Visa Number" },
      { key: "visaStatus", label: "Visa Status" },
      { key: "visaProfession", label: "Visa Profession" },
      { key: "visaReceivedDate", label: "Visa Received Date" },
      { key: "visaExpiryDate", label: "Visa Expiry Date" },
      { key: "qvcStatus", label: "QVC Status" },
      { key: "mofaStatus", label: "MOFA Status" },
    ],
  },
  {
    group: "Flight",
    fields: [
      { key: "flightStatus", label: "Flight Status" },
      { key: "deploymentOn", label: "Deployment Date" },
    ],
  },
  {
    group: "Medical",
    fields: [
      { key: "medicalStatus", label: "Medical Status" },
      { key: "pccStatus", label: "PCC Status" },
    ],
  },
];

// Flat list, handy for default-checked state / lookups
export const ALL_EXPORT_FIELDS = EXPORT_FIELD_GROUPS.flatMap((g) => g.fields);

// Fields checked by default when the export modal opens
export const DEFAULT_CHECKED_KEYS = [
  "name", "phone", "passportNumber",
  "appliedCountry", "appliedCategory",
  "visaStatus", "flightStatus", "medicalStatus",
];

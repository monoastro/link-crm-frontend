import { defineEntity } from "@/packages/admin/index.jsx";
import { Contact } from "lucide-react";
import CandidateCvExportButton from "@/components/organisms/CandidateCvExportButton.jsx";

export const candidates = defineEntity({
  slug: "candidates",
  label: "Candidates",
  icon: Contact,
  titleField: "name",
  addLabel: "Add Candidate",
  rowHref: (candidate) => `/candidates/${candidate.id}`,
  editHref: (candidate) => `/candidates/${candidate.id}/edit`,
  bulkActions: ({ selectedItems }) => (
    <CandidateCvExportButton candidates={selectedItems} />
  ),
  roles: ["admin", "frontdesk", "flight", "visa", "medical"],
  fields: [
    { name: "name", type: "text", label: "Name" },
    { name: "email", type: "email", label: "Email", invisible: true },
    { name: "phone", type: "tel", label: "Phone", invisible: true },
    { name: "passportNumber", type: "text", label: "Passport", invisible: true },
    { name: "appliedCountry", type: "text", label: "Applied Country" },
    { name: "appliedCategoryName", type: "text", label: "Applied Category" },
    { name: "visaStatus:status", type: "text", label: "Visa Status" },
    { name: "visaRemarks", type: "text", label: "Visa Remarks" },
    { name: "address", type: "text", label: "Address", invisible: true },
    { name: "dob", type: "date", label: "Date of Birth", invisible: true },
    { name: "placeOfBirth", type: "text", label: "Place of Birth", invisible: true },
  ],
  filters: [
    {
      field: "visaStatus",
      label: "Visa Status",
      options: [
        { value: "Waiting", label: "Waiting" },
        { value: "Received", label: "Received" },
        { value: "Rejected", label: "Rejected" },
      ],
    },
    {
      field: "isSelected",
      label: "Selected",
      options: [
        { value: true, label: "Yes" },
        { value: false, label: "No" },
      ],
    },
    {
      field: "appliedCountry",
      label: "Applied Country",
      options: [], // populate from distinct DB values, or wire up dynamically
    },
  ],
});

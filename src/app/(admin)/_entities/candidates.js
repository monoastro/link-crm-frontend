import { defineEntity } from "@/packages/admin/index.jsx";
import { Contact } from "lucide-react";

export const candidates = defineEntity({
  slug: "candidates",
  label: "Candidates",
  icon: Contact,
  titleField: "name",
  addLabel: "Add Candidate",
  rowHref: (candidate) => `/candidates/${candidate.id}`,
  editHref: (candidate) => `/candidates/${candidate.id}/edit`,
  roles: ["admin", "frontdesk", "flight", "visa", "medical"],
  fields: [
    { name: "name", type: "text", label: "Name" },
    { name: "email", type: "email", label: "Email", invisible: true },
    { name: "phone", type: "tel", label: "Phone", invisible: true },
    { name: "passportNumber", type: "text", label: "Passport" },
    { name: "appliedCountry", type: "text", label: "Applied Country" },
    { name: "appliedCategory", type: "text", label: "Applied Category" },
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
      field: "appliedCountry",
      label: "Applied Country",
      options: [], // populate from distinct DB values, or wire up dynamically
    },
  ],
});

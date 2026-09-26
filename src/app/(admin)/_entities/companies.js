// src/entities/companies.js
import { defineEntity } from "@/packages/admin/index.jsx";
import { Building2 } from "lucide-react";

export const companies = defineEntity({
  slug: "companies",
  label: "Companies",
  icon: Building2,
  titleField: "name",
  addLabel: "Add Company",
  rowHref: (company) => `/companies/${company.id}`,
  editHref: (company) => `/companies/${company.id}/edit`,
  roles: ["admin"],
  fields: [
    { name: "name", type: "text", label: "Name", required: true },
    { name: "country", type: "text", label: "Country", required: true },
    {
      name: "parentCompanyId",
      type: "relationship",
      label: "Parent Company",
      relationTo: "companies",
      labelField: "name",
      valueField: "id",
      excludeSelf: true,
      searchable: true,
    },
  ],
});

import { defineEntity } from "@/packages/admin/index.jsx";
import { Building2 } from "lucide-react";
import { countries } from "./countries";

export const companies = defineEntity({
  slug: "companies",
  label: "Companies",
  addLabel: "Add Company",
  icon: Building2,
  titleField: "name",
  roles: ["admin", "frontdesk", "flight", "visa", "medical"],
  fields: [
    { name: "name", type: "text", label: "Company Name", required: true },
    { name: "country", type: "select", label: "Country", options: countries, required: true },
  ],
});

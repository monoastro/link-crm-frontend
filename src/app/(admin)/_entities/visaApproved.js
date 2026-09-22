import { defineEntity } from "@/packages/admin/index.jsx";
import { BadgeCheck } from "lucide-react";

export const visaApproved = defineEntity({
  slug: "visa-approved",
  label: "Visa Approved",
  icon: BadgeCheck,
  titleField: "name",
  roles: ["admin"],
  fields: [
    { name: "name", type: "text", label: "Name", required: true },
  ],
});



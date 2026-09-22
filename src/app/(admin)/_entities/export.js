import { defineEntity } from "@/packages/admin/index.jsx";
import { Save } from "lucide-react";

export const candidateExport = defineEntity({
  slug: "export",
  label: "Export",
  icon: Save,
  titleField: "name",
  roles: ["admin"],
  fields: [
    { name: "name", type: "text", label: "Name", required: true },
  ],
});


import { defineEntity } from "@/packages/admin/index.jsx";
import { Users } from "lucide-react";

export const users = defineEntity({
  slug: "users",
  label: "Users",
  icon: Users,
  titleField: "name",
  roles: ["admin"],
  fields: [
    { name: "username", type: "text", label: "Userame", required: true },
    { name: "password", type: "password", label: "Password", invisible: true },
    {
      name: "role",
      type: "select",
      column: "right",
      label: "Role",
      options: ["admin", "editor"],
    },
  ],
  filters: [
    {
      field: "role",
      label: "Roles",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
    },
  ],
});


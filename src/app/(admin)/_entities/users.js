import { defineEntity } from "@/packages/admin/index.jsx";
import { Users } from "lucide-react";

export const users = defineEntity({
  slug: "users",
  label: "Users",
  icon: Users,
  titleField: "name",
  addLabel: "Add User",
  roles: ["admin"],
  fields: [
    { name: "username", type: "text", label: "Username", required: true },
    { name: "password", type: "password", label: "Password", invisible: true },
    {
      name: "role",
      type: "select",
      column: "right",
      label: "Role",
      options: ["admin", "frontdesk", "flight", "visa", "medical"],
    },
  ],
  filters: [
    {
      field: "role",
      label: "Roles",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Front Desk", value: "frontdesk" },
        { label: "Flight", value: "flight" },
        { label: "Visa", value: "visa" },
        { label: "Medical", value: "medical" },
      ],
    },
  ],
});

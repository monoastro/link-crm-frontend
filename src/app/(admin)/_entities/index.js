import { defineEntities } from "@/packages/admin/index.jsx";
import { users } from "./users";
import { candidates } from "./candidates";

export const entities = defineEntities({
  users,
  candidates,
})

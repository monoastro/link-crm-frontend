import { defineEntities } from "@/packages/admin/index.jsx";
import { users } from "./users";
import { candidates } from "./candidates";
import { companies } from "./companies";

export const entities = defineEntities({
  users,
  candidates,
  companies,
});

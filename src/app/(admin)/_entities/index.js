import { defineEntities } from "@/packages/admin/index.jsx";
import { users } from "./users";
import { candidates } from "./candidates";
import { companies } from "./companies";
import { candidateExport } from "./export";
import { visaApproved } from "./visaApproved";

export const entities = defineEntities({
  users,
  visaApproved,
  candidates,
  companies,
  candidateExport,
})

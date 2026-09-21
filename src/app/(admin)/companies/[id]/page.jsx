// src/app/companies/[id]/page.js
"use client";

import { useParams, useRouter } from "next/navigation";
import {
  AdminLayout,
  removeEmptyFields,
  useApi,
  useGet,
  useToast,
} from "@/packages/admin";
import { Loader2 } from "lucide-react";
import { Input, Select, Form, RelationshipField } from "@/packages/admin";

export default function CompanyEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { post, patch } = useApi();

  const isNew = id === "new";
  const apiPath = "/companies";
  const { data, loading } = useGet(isNew ? null : `${apiPath}/${id}`);

  // Fetch all companies for the parent-company dropdown.
  // Excludes itself from the list so a company can't be selected as its own parent.

  if (!isNew && loading) {
    return (
      <AdminLayout title="Company">
        <Loader2 size={18} className="animate-spin text-gray-400" />
        Loading…
      </AdminLayout>
    );
  }

  async function handleSubmit(values) {
    const payload = removeEmptyFields(values);

    const url = isNew ? apiPath : `${apiPath}/${id}`;
    const res = isNew ? await post(url, payload) : await patch(url, payload);

    if (res?.ok) {
      toast.success(`Company ${isNew ? "created" : "updated"} successfully`);
      router.replace("/companies");
    }
    return res;
  }

  return (
    <AdminLayout title={`${isNew ? "New" : "Edit"} Company`} formId="company-form">
      <Form
        defaults={data?.item ?? {}}
        id="company-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
          <Input name="name" placeholder="Company name" required />

          <RelationshipField
            key={data?.item?.id} // Force re-render when editing a different company
            field={{
              name: "parentCompanyId",
              type: "relationship",
              label: "Parent Company",
              relationTo: "companies",
              labelField: "name",
              valueField: "id",
              excludeSelf: true,
              searchable: true,
            }}
          />
        </div>
      </Form>
    </AdminLayout>
  );
}

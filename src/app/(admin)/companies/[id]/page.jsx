// src/app/companies/[id]/page.js
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  AdminLayout,
  removeEmptyFields,
  useApi,
  useGet,
  useToast,
  RelationshipField,
  Form,
} from "@/packages/admin";
import { Input, Select } from "@/packages/admin";
import { VacanciesField } from "@/components/templates/VacanciesField.jsx";
import { countries } from "@/app/(admin)/_entities/countries";

const COUNTRY_OPTIONS = countries.map(({ label }) => ({ value: label, label }));

export default function CompanyEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { post, patch } = useApi();

  const isNew = id === "new";
  const apiPath = "/companies";
  const { data, isLoading: loading } = useGet(isNew ? null : `${apiPath}/${id}`);

  // Vacancies are a nested array, not a scalar field, so they're tracked as
  // controlled state separate from the rest of the Form's fields. Seeded
  // from the loaded company once data arrives; stays null until then so we
  // can tell "not yet loaded" apart from "user cleared everything".
  const [vacancies, setVacancies] = useState(null);
  const currentVacancies = vacancies ?? data?.item?.vacancies ?? [];

  if (!isNew && loading) {
    return (
      <AdminLayout title="Company">
        <Loader2 size={18} className="animate-spin text-gray-400" />
        Loading…
      </AdminLayout>
    );
  }

  async function handleSubmit(values) {
    const clean = removeEmptyFields({
      name: values.name,
      country: values.country,
      parentCompanyId: values.parentCompanyId,
    });

    // Strip client-only concerns before sending: existing vacancies keep
    // their `code` so the backend knows to update them in place; new ones
    // are sent without `code` so the server generates one on insert.
    const payloadVacancies = currentVacancies.map((v) => {
      const { code, position, openings, status } = v;
      return code ? { code, position, openings, status } : { position, openings, status };
    });

    const payload = {
      ...clean,
      vacancies: payloadVacancies,
    };

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
          <div className="flex gap-4">
            <Input name="name" placeholder="Company name" required />
            <Select name="country" placeholder="Country" required>
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <RelationshipField
            field={{
              name: "parentCompanyId",
              label: "Parent company",
              relationTo: "companies",
              labelField: "name",
              valueField: "id",
              searchable: true,
              // avoid letting a company be selected as its own parent when
              // editing an existing one
              excludeIds: isNew ? [] : [id],
            }}
          />
        </div>

        {/* Vacancies — nested list with Open/History tabs, add/edit/remove
            handled entirely client-side; the full set is submitted together
            with the rest of the company payload on save. */}
        <div className="rounded-sm border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Vacancies</h3>
          <VacanciesField
            name="vacancies"
            value={currentVacancies}
            onChange={setVacancies}
          />
        </div>
      </Form>
    </AdminLayout>
  );
}

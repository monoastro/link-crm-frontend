"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { AdminLayout, Form, useGet } from "@/packages/admin";
import { VacanciesField } from "@/components/templates/VacanciesField.jsx";
import { countries } from "@/app/(admin)/_entities/countries";

export default function CompanyDetailsPage() {
  const { id } = useParams();
  const { data, isLoading } = useGet(`/companies/${id}`);
  const company = data?.item;

  if (isLoading || !company) {
    return (
      <AdminLayout title="Company">
        <Loader2 size={18} className="animate-spin text-gray-400" />
        Loading…
      </AdminLayout>
    );
  }

  const countryName = countries.find(({ value }) => value === company.country)?.label ?? company.country;

  return (
    <AdminLayout title={company.name ?? "Company"}>
      <div className="flex flex-col gap-6">
        <div className="flex justify-end">
          <Link
            href={`/companies/${id}/edit`}
            className="flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            <Pencil size={15} />
            Edit Company
          </Link>
        </div>

        <section className="flex flex-col gap-4 rounded-sm border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Company Details</h2>
          <div className="flex flex-wrap gap-4">
            <ReadField label="Company name" value={company.name} />
            <ReadField label="Country" value={countryName} />
            <ReadField label="Parent company" value={company.parentCompany?.name} />
          </div>
        </section>

        <section className="rounded-sm border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Vacancies</h2>
          <Form defaults={company} onSubmit={() => {}}>
            <VacanciesField
              name="vacancies"
              value={company.vacancies ?? []}
              onChange={() => {}}
              readOnly
            />
          </Form>
        </section>
      </div>
    </AdminLayout>
  );
}

function ReadField({ label, value }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="truncate text-sm text-gray-800">{value || "—"}</span>
    </div>
  );
}

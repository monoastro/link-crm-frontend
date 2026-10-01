// src/app/companies/[id]/page.js
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { AdminLayout, Form, useGet } from "@/packages/admin";
import { VacanciesField } from "@/components/templates/VacanciesField.jsx";
import { countries } from "@/app/(admin)/_entities/countries";

const CARD = "rounded-sm border border-gray-200 bg-white p-3 sm:p-6";

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
      <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
        <div className="flex sm:justify-end">
          <Link
            href={`/companies/${id}/edit`}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:w-auto sm:py-2"
          >
            <Pencil size={15} />
            Edit Company
          </Link>
        </div>

        <section className={`flex min-w-0 flex-col gap-4 ${CARD}`}>
          <h2 className="text-sm font-semibold text-gray-900">Company Details</h2>
          {/* Stacked on mobile, wrapping row from sm */}
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <ReadField label="Company name" value={company.name} />
            <ReadField label="Country" value={countryName} />
            <ReadField label="Parent company" value={company.parentCompany?.name} />
          </div>
        </section>

        <section className={`min-w-0 ${CARD}`}>
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
    <div className="flex min-w-0 flex-col gap-1 sm:flex-1">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      {/* Wrap on mobile so long names stay readable; truncate from sm */}
      <span className="break-words text-sm text-gray-800 sm:truncate">{value || "—"}</span>
    </div>
  );
}

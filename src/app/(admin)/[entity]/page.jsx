"use client";

import { notFound, useParams } from "next/navigation";
import { AdminChildrenLayout } from "@/packages/admin";

import { entities } from "@/app/(admin)/entities";

function tableFields(config) {
  return config.fields
    .filter((f) => f.type !== "relationship" && !f.invisible)
    .map((f) => ({ key: f.name, head: f.label }));
}

export default function EntityListPage() {
  const { entity } = useParams();
  const config = entities[entity];

  if (!config) notFound();

  return (
    <AdminChildrenLayout
      name={config.slug}
      route={`/${config.slug}/`}
      tablefields={tableFields(config)}
      filters={config.filters}
      bulkActions={config.bulkActions}
    />
  );
}

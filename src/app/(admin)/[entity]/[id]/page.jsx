"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import {
  AdminLayout,
  PayloadEntityForm,
  removeEmptyFields,
  useApi,
  useGet,
  useToast,
} from "@/packages/admin";
import { Loader2 } from "lucide-react";

import { entities } from "@/app/(admin)/entities";

function coerceRelationshipIds(values, fields) {
  const relationshipFields = fields.filter((f) => f.type === "relationship");
  if (relationshipFields.length === 0) return values;

  const coerced = { ...values };
  for (const field of relationshipFields) {
    const raw = coerced[field.name];
    if (raw == null || raw === "") continue;

    const toNumberOrKeep = (v) => (v !== "" && !isNaN(Number(v)) ? Number(v) : v);
    coerced[field.name] = Array.isArray(raw) ? raw.map(toNumberOrKeep) : toNumberOrKeep(raw);
  }
  return coerced;
}

export default function EntityEditPage() {
  const { entity: entitySlug, id } = useParams();
  const toast = useToast();
  const entity = entities[entitySlug];
  const { post, patch } = useApi();
  const router = useRouter();
  if (!entity) notFound();
  const isNew = id === "new";
  const apiPath = `/${entity.slug}`;
  const { data, isLoading: loading } = useGet(isNew ? null : `${apiPath}/${id}`);

  if (!isNew && loading) {
    return (
      <AdminLayout title={entity.label}>
        <Loader2 size={18} className="animate-spin text-gray-400" />
        Loading…
      </AdminLayout>
    );
  }

  async function handleSubmit(values) {
    const definedValues = removeEmptyFields(values);
    const url = isNew ? apiPath : `${apiPath}/${id}`;
    const payload = coerceRelationshipIds(definedValues, entity.fields);
    const res = isNew ? await post(url, payload) : await patch(url, payload);
    if (res?.ok) {
      toast.success(`${entity.label} ${isNew ? "created" : "updated"} successfully`);
      router.replace(`/${entitySlug}`);
    }
    return res;
  }

  return (
    <AdminLayout title={`${isNew ? "New" : "Edit"} ${entity.label}`} formId="entity-form">
      <PayloadEntityForm
        collectionFields={entity.fields}
        defaults={data?.item ?? {}}
        onSubmit={handleSubmit}
        externalId="entity-form"
      />
    </AdminLayout>
  );
}

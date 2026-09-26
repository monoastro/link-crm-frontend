// src/app/notifications/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Bell, ChevronRight, RefreshCw } from "lucide-react";
import { AdminLayout, useGet } from "@/packages/admin";

const STATUS_STYLES = {
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", Icon: Check },
  rejected: { bg: "bg-rose-50", text: "text-rose-700", Icon: X },
  progress: { bg: "bg-amber-50", text: "text-amber-700", Icon: Loader2, spin: true },
  default: { bg: "bg-blue-50", text: "text-blue-700", Icon: Bell },
};

const PAGE_SIZE = 20;

function humanizeField(field = "") {
  return field.replace(/Status$/i, "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

function classifyStatus(to) {
  const value = String(to ?? "").toLowerCase();
  if (!to) return { phrase: "was cleared", bucket: "default" };
  if (value.includes("approv")) return { phrase: "was approved", bucket: "approved" };
  if (value.includes("complet") || value.includes("done") || value.includes("issued"))
    return { phrase: "was completed", bucket: "approved" };
  if (value.includes("reject") || value.includes("denied"))
    return { phrase: "was rejected", bucket: "rejected" };
  if (value.includes("cancel")) return { phrase: "was cancelled", bucket: "rejected" };
  if (value.includes("pending") || value.includes("progress") || value.includes("process"))
    return { phrase: "is in progress", bucket: "progress" };
  return { phrase: `is now "${to}"`, bucket: "default" };
}

function formatNotification(n) {
  const { candidateName, field, to } = n.data || {};
  if (!candidateName || !field) return { text: n.title, bucket: "default" };
  const { phrase, bucket } = classifyStatus(to);
  return { text: `${candidateName}'s ${humanizeField(field)} ${phrase}`, bucket };
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading: loading } = useGet(`/notifications?page=${page}&limit=${PAGE_SIZE}`);

  const items = data?.items ?? [];
  const hasMore = Boolean(data?.hasMore);

  return (
    <AdminLayout title="Notifications">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <p className="text-sm text-gray-500">
          {loading ? "Loading…" : `${items.length} event${items.length === 1 ? "" : "s"}`}
        </p>

        {/* List */}
        <div className="overflow-hidden rounded-sm border border-gray-200 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <Loader2 size={20} className="animate-spin text-gray-400" />
              <p className="text-sm text-gray-400">Loading notifications…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <Bell size={22} className="text-gray-300" />
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((n) => {
                const { text, bucket } = formatNotification(n);
                const style = STATUS_STYLES[bucket];
                const { Icon } = style;

                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => router.push(n.data?.candidateId ? `/candidates/${n.data.candidateId}` : "/notifications")}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-gray-50"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                      <Icon size={16} strokeWidth={2.5} className={`${style.text} ${style.spin ? "animate-spin" : ""}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm capitalize leading-snug text-gray-800">
                        {text}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                    </div>

                    <ChevronRight size={16} className="shrink-0 text-gray-300" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && hasMore && (
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center justify-center gap-1.5 self-center rounded-sm border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={12} />
            Load more
          </button>
        )}
      </div>
    </AdminLayout>
  );
}

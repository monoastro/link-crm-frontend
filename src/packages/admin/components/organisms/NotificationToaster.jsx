// components/NotificationToaster.jsx
"use client";

import { useRouter } from "next/navigation";
import { Check, X, Loader2, Bell, ArrowRight } from "lucide-react";
import { useNotificationsContext } from "../../contexts/NotificationsContext.jsx";

const STATUS_STYLES = {
  approved: { ring: "ring-emerald-500/20", dot: "bg-emerald-500", Icon: Check },
  rejected: { ring: "ring-rose-500/20", dot: "bg-rose-500", Icon: X },
  progress: { ring: "ring-amber-500/20", dot: "bg-amber-500", Icon: Loader2, spin: true },
  default: { ring: "ring-blue-500/20", dot: "bg-blue-500", Icon: Bell },
};

// turns "visaStatus" -> "visa", "medicalStatus" -> "medical"
function humanizeField(field = "") {
  return field.replace(/Status$/i, "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

// picks a friendly phrase + style bucket from the raw "to" value
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

  if (!candidateName || !field) {
    return { text: n.title, bucket: "default" };
  }

  const { phrase, bucket } = classifyStatus(to);
  return {
    text: `${candidateName}'s ${humanizeField(field)} ${phrase}`,
    bucket,
  };
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationToaster() {
  const { toasts, dismissToast } = useNotificationsContext();
  const router = useRouter();

  if (toasts.length === 0) return null;

  function openToast(id) {
    const notification = toasts.find((toast) => toast.id === id);
    dismissToast(id);
    router.push(notification?.data?.candidateId ? `/candidates/${notification.data.candidateId}` : "/notifications");
  }

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-96 flex-col">
      <style jsx global>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(16px) scale(0.98); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .toast-enter {
          animation: toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      <div className="flex flex-col gap-3">
        {toasts.map((n) => {
          const { text, bucket } = formatNotification(n);
          const style = STATUS_STYLES[bucket];
          const { Icon } = style;

          return (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              onClick={() => openToast(n.id)}
              onKeyDown={(e) => e.key === "Enter" && openToast(n.id)}
              className={`toast-enter group relative flex cursor-pointer gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] ring-1 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.15)] ${style.ring}`}
            >
              <div className={`absolute left-0 top-0 h-full w-1 ${style.dot}`} />

              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${style.dot}`}>
                <Icon size={16} strokeWidth={2.5} className={style.spin ? "animate-spin" : ""} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium capitalize leading-snug text-gray-900">
                    {text}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissToast(n.id);
                    }}
                    className="shrink-0 rounded-full p-1 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-500"
                    aria-label="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* attached footer, sticks right under the last toast */}
      <button
        onClick={() => router.push("/notifications")}
        className="-mt-px flex items-center justify-center gap-1.5 rounded-b-2xl border border-t-0 border-gray-100 bg-gray-50/95 py-2.5 text-xs font-medium text-gray-600 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] backdrop-blur-sm transition hover:bg-gray-100 hover:text-gray-900"
      >
        See all notifications
        <ArrowRight size={12} />
      </button>
    </div>
  );
}

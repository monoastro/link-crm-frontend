// components/NotificationToaster.jsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Bell, ArrowRight } from "lucide-react";
import { useNotificationsContext } from "../../contexts/NotificationsContext.jsx";

// Muted tints that sit well on the white/gray admin UI
const STATUS_STYLES = {
  approved: { icon: "bg-emerald-50 text-emerald-600 ring-emerald-100", Icon: Check },
  rejected: { icon: "bg-rose-50 text-rose-600 ring-rose-100", Icon: X },
  progress: { icon: "bg-amber-50 text-amber-600 ring-amber-100", Icon: Loader2, spin: true },
  default: { icon: "bg-gray-100 text-gray-600 ring-gray-200", Icon: Bell },
};

const SWIPE_DISMISS_PX = 90;
const MOBILE_VISIBLE = 3; // on small screens only the newest few are shown

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

// ---------------------------------------------------------------------------
// Swipe left/right to dismiss. Vertical scrolling still works (touch-action),
// and a drag never counts as a tap.
// ---------------------------------------------------------------------------
function SwipeToDismiss({ onDismiss, onTap, className = "", children }) {
  const startX = useRef(null);
  const moved = useRef(false);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    startX.current = null;
    setDragging(false);
    setDx(0);
  };

  const handlePointerDown = (e) => {
    // let the dismiss "x" button handle its own click
    if (e.target.closest("button")) return;
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (startX.current == null) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 5) moved.current = true;
    setDx(delta);
  };

  const handlePointerUp = () => {
    if (startX.current == null) return;
    if (Math.abs(dx) > SWIPE_DISMISS_PX) {
      const dir = dx > 0 ? 1 : -1;
      startX.current = null;
      setDragging(false);
      setDx(dir * window.innerWidth); // fly off-screen, then remove
      setTimeout(onDismiss, 180);
    } else {
      reset();
    }
  };

  const handleClick = () => {
    if (moved.current) {
      moved.current = false;
      return;
    }
    onTap();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && onTap()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={reset}
      style={{
        transform: `translateX(${dx}px)`,
        opacity: 1 - Math.min(Math.abs(dx) / 240, 0.7),
        transition: dragging ? "none" : "transform 180ms ease-out, opacity 180ms ease-out",
        touchAction: "pan-y",
      }}
      className={className}
    >
      {children}
    </div>
  );
}

export default function NotificationToaster() {
  const { toasts, dismissToast } = useNotificationsContext();
  const router = useRouter();

  if (toasts.length === 0) return null;

  function openToast(id) {
    const notification = toasts.find((toast) => toast.id === id);
    dismissToast(id);
    router.push(
      notification?.data?.candidateId
        ? `/candidates/${notification.data.candidateId}`
        : "/notifications"
    );
  }

  return (
    <div
      className="fixed inset-x-3 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-96"
      style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <style jsx global>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .toast-enter {
          animation: toast-in 0.2s ease-out;
        }
      `}</style>

      {toasts.map((n, i) => {
        const { text, bucket } = formatNotification(n);
        const style = STATUS_STYLES[bucket];
        const { Icon } = style;

        return (
          // outer wrapper owns the enter animation, inner one owns the swipe
          <div key={n.id} className={`toast-enter ${i >= MOBILE_VISIBLE ? "hidden sm:block" : ""}`}>
            <SwipeToDismiss
              onDismiss={() => dismissToast(n.id)}
              onTap={() => openToast(n.id)}
              className="group flex cursor-pointer select-none items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${style.icon}`}
              >
                <Icon size={15} strokeWidth={2.5} className={style.spin ? "animate-spin" : ""} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium leading-snug text-gray-900">{text}</p>
                <p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(n.id);
                }}
                className="-mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </SwipeToDismiss>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => router.push("/notifications")}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        See all notifications
        <ArrowRight size={12} />
      </button>
    </div>
  );
}

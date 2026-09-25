// components/NotificationBell.jsx
"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useNotificationsContext } from "../../contexts/NotificationsContext.jsx";

export function NotificationBell() {
  const { unseen, clearUnseen } = useNotificationsContext();
  const router = useRouter();

  function handleClick() {
    clearUnseen();
    router.push("/notifications");
  }

  return (
    <button
      onClick={handleClick}
      className="relative cursor-pointer rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
      aria-label="Notifications"
      title="Notifications"
    >
      <Bell size={20} strokeWidth={2} />
      {unseen.length > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
          {unseen.length > 99 ? "99+" : unseen.length}
        </span>
      )}
    </button>
  );
}

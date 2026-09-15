import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut } from "lucide-react";

export function ProfileDropdown({
  user = {
    id: "c2c7e132-3f67-474d-8605-150fbc8ebf6c",
    name: "admin",
    email: "doge@gmail.com",
    role: "admin",
    createdAt: "2026-09-06T06:37:14.599Z",
  },
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { label: "Account", icon: User, onClick: () => {} },
    { label: "Settings", icon: Settings, onClick: () => {} },
  ];

  const initial = user.username?.charAt(0).toUpperCase();

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md p-1 hover:bg-gray-100"
      >
        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
          {initial}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 py-2 z-50">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user.role}</p>
            </div>
          </div>

          <div className="my-1 border-t border-gray-100" />

          {menuItems.map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Icon className="h-4 w-4 text-gray-500" />
              {label}
            </button>
          ))}

          <div className="my-1 border-t border-gray-100" />

          <button
            onClick={() => {}}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

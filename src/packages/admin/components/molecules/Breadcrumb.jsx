"use client";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, House } from "lucide-react";

export default function Breadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, i) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1),
    path: "/" + segments.slice(0, i + 1).join("/"),
  }));

  const lastIndex = crumbs.length - 1;

  return (
    <div className="flex min-w-0 items-center gap-1 sm:gap-3">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:h-8 sm:w-8"
        aria-label="Go back"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Mobile: only the current page. sm+: the full trail. */}
      <div className="flex min-w-0 items-center gap-1 sm:flex-wrap">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="hidden items-center gap-1.5 rounded-md px-1 py-1 text-gray-500 transition-colors hover:text-gray-900 sm:flex"
        >
          <House size={14} />
          <span className="text-sm">Home</span>
        </button>

        {crumbs.map((crumb, i) => {
          const isLast = i === lastIndex;
          return (
            <div
              key={crumb.path}
              className={`min-w-0 items-center gap-1 ${isLast ? "flex" : "hidden sm:flex"}`}
            >
              <ChevronRight size={16} className="hidden shrink-0 text-gray-400 sm:block" />
              {isLast ? (
                <span className="truncate text-sm font-semibold text-gray-900">
                  {crumb.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push(crumb.path)}
                  className="rounded-md px-1 py-1 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900"
                >
                  {crumb.label}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

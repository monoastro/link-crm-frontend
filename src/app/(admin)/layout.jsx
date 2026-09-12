"use client";

import "@/admin.config.js";

import { AdminProvider } from "@/packages/admin";

export default function AdminLayout({ children }) {
  return <AdminProvider>{children}</AdminProvider>;
}


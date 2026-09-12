"use client";

import "@/admin.config.js";

import { LoginPage } from "@/packages/admin";

export default function Page() {
  return <LoginPage redirectTo="/dashboard" />;
}


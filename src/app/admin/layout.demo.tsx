import type { ReactNode } from "react";
import AppShell from "@/components/shell/AppShell";

// Static demo build: the session lives in the browser, so the shell does the sign-in check client-side.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

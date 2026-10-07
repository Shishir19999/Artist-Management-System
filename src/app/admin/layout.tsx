import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import AppShell from "@/components/shell/AppShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  // revoked / deleted-user tokens (empty id, see jwt callback) must not see admin pages
  if (!session?.user?.id) redirect("/auth/login");
  return <AppShell>{children}</AppShell>;
}

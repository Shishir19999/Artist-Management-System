"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LuMusic } from "react-icons/lu";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const path = (usePathname() ?? "").replace(/\/$/, "");
  const heading = path === "/auth/register" ? "Create your account" : "Welcome back";
  const sub = path === "/auth/register" ? "New accounts start with the User role." : "Sign in to manage your roster and catalogue.";

  return (
    <div className="hero-gradient flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="bg-primary text-primary-content flex size-9 items-center justify-center rounded-xl" aria-hidden>
            <LuMusic />
          </span>
          Artist Studio
        </Link>
        <ThemeToggle />
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="surface w-full max-w-md p-6 shadow-xl sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          <p className="muted mt-1 mb-6 text-sm">{sub}</p>
          {children}
        </div>
      </main>
    </div>
  );
}

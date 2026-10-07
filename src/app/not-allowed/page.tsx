import Link from "next/link";
import { LuShield } from "react-icons/lu";
import GoToBack from "@/components/GoToBack";

export const metadata = { title: "Not available for your role" };

export default function UnauthorizedPage() {
  return (
    <main id="main" className="hero-gradient flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="bg-warning text-warning-content flex size-14 items-center justify-center rounded-2xl text-2xl" aria-hidden>
        <LuShield />
      </span>
      <h1 className="text-4xl font-bold tracking-tight">Not available for your role</h1>
      <p className="muted max-w-md">This page is not part of your workspace. Everything you can use is in the menu on your dashboard.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <GoToBack />
        <Link href="/admin/dashboard" className="btn btn-ghost min-h-11">
          Dashboard
        </Link>
      </div>
    </main>
  );
}

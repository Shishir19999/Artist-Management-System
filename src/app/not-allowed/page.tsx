import Link from "next/link";
import { LuShield } from "react-icons/lu";

export const metadata = { title: "Access denied" };

export default function UnauthorizedPage() {
  return (
    <main className="hero-gradient flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="bg-warning text-warning-content flex size-14 items-center justify-center rounded-2xl text-2xl" aria-hidden>
        <LuShield />
      </span>
      <h1 className="text-4xl font-bold tracking-tight">You do not have access to that page</h1>
      <p className="muted max-w-md">Your role does not include this area. If you think that is a mistake, ask an administrator.</p>
      <Link href="/admin/dashboard" className="btn btn-primary">
        Back to the dashboard
      </Link>
    </main>
  );
}

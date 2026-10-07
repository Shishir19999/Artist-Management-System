import Link from "next/link";
import { LuMusic } from "react-icons/lu";

export const metadata = { title: "Page not found" };

export default function CustomNotFoundPage() {
  return (
    <main className="hero-gradient flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="bg-primary text-primary-content flex size-14 items-center justify-center rounded-2xl text-2xl" aria-hidden>
        <LuMusic />
      </span>
      <p className="text-primary text-sm font-semibold tracking-widest uppercase">Error 404</p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">This page is off the setlist</h1>
      <p className="muted max-w-md">The address you followed does not exist or has moved. Head back and pick up where you left off.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Back to the home page
        </Link>
        <Link href="/admin/dashboard" className="btn btn-outline">
          Open the dashboard
        </Link>
      </div>
    </main>
  );
}

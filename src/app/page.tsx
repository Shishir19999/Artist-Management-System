import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const dynamic = "force-dynamic";

const LINKS: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/user", label: "Manage users" },
    { href: "/admin/artist", label: "Manage artists" },
    { href: "/admin/music", label: "Manage music" },
  ],
  ARTIST_MANAGER: [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/artist", label: "Manage artists" },
    { href: "/admin/music", label: "Manage music" },
  ],
  USER: [
    { href: "/admin/artist", label: "My artists" },
    { href: "/admin/music", label: "My music" },
  ],
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const links = session ? LINKS[session.user.role] ?? [] : [];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-blue-50 p-6 text-center">
      <h1 className="text-4xl font-bold text-gray-800">Artist Management System</h1>
      <p className="max-w-xl text-gray-600">
        Manage users, artists and their music catalogue in one place.
      </p>

      {session ? (
        <>
          <p className="text-gray-700">
            Signed in as <strong>{session.user.email}</strong> ({session.user.role})
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="btn btn-primary">
                {l.label}
              </Link>
            ))}
          </div>
        </>
      ) : (
        <Link href="/auth/login" className="btn btn-primary">
          Sign in
        </Link>
      )}
    </main>
  );
}

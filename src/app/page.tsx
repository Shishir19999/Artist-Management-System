import Link from "next/link";
import type { ReactNode } from "react";
import {
  LuActivity,
  LuCalendar,
  LuChartColumn,
  LuFileSpreadsheet,
  LuHeadphones,
  LuListMusic,
  LuMic,
  LuMusic,
  LuShield,
  LuUsers,
} from "react-icons/lu";
import LandingCta from "@/components/landing/LandingCta";
import Parallax from "@/components/motion/Parallax";
import Reveal from "@/components/motion/Reveal";
import ThemeToggle from "@/components/ui/ThemeToggle";

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <LuMic aria-hidden />,
    title: "Artist profiles",
    text: "Photo, biography, social links, discography and bookings on one page for every artist on your roster.",
  },
  {
    icon: <LuMusic aria-hidden />,
    title: "Song catalogue",
    text: "Track titles, albums, genres, durations, release dates and cover art, and hear a short preview with one click.",
  },
  {
    icon: <LuChartColumn aria-hidden />,
    title: "Analytics dashboard",
    text: "Artists by genre, songs per release year, top artists and upcoming gigs, scoped to what each person may see.",
  },
  {
    icon: <LuCalendar aria-hidden />,
    title: "Gigs and bookings",
    text: "A month calendar with status markers keeps holds, confirmed dates and completed shows in view.",
  },
  {
    icon: <LuListMusic aria-hidden />,
    title: "Playlists and favorites",
    text: "Group songs into ordered playlists and star the artists and tracks you come back to most.",
  },
  {
    icon: <LuFileSpreadsheet aria-hidden />,
    title: "Tables that work",
    text: "Sort, filter, search, paginate, choose columns, act on many rows at once, and import or export CSV.",
  },
];

const ROLES: { icon: ReactNode; name: string; text: string }[] = [
  {
    icon: <LuShield aria-hidden />,
    name: "Admin",
    text: "Full control: users and roles, every artist and song, the complete audit trail.",
  },
  {
    icon: <LuUsers aria-hidden />,
    name: "Artist manager",
    text: "Runs the roster: creates and edits artists, songs and gigs, imports data, curates playlists.",
  },
  {
    icon: <LuHeadphones aria-hidden />,
    name: "User",
    text: "Read-only access to their own artists and songs, plus personal playlists and favorites.",
  },
];

const SPARK = [38, 54, 46, 70, 62, 88, 74, 96];

export default function HomePage() {
  return (
    <div className="bg-base-100 min-h-screen">
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="border-base-300 bg-base-100/85 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="bg-primary text-primary-content flex size-9 items-center justify-center rounded-xl" aria-hidden>
              <LuMusic />
            </span>
            Artist Studio
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-1">
            <a href="#features" className="btn btn-ghost btn-sm hidden sm:inline-flex">
              Features
            </a>
            <a href="#roles" className="btn btn-ghost btn-sm hidden sm:inline-flex">
              Roles
            </a>
            <ThemeToggle />
            <LandingCta variant="nav" />
          </nav>
        </div>
      </header>

      <main id="content">
        <section className="hero-gradient relative overflow-hidden">
          <Parallax speed={0.22} className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-primary/20 blur-3xl" />
          <Parallax speed={-0.12} className="pointer-events-none absolute -right-20 top-40 size-80 rounded-full bg-secondary/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="badge badge-primary badge-outline mb-4 font-medium">For managers, labels and booking teams</p>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Your roster, your catalogue and your calendar in one place.
              </h1>
              <p className="muted mt-5 max-w-xl text-lg">
                Artist Studio keeps artist profiles, songs, playlists and gigs organised, with role-based access so everyone sees exactly what
                they should.
              </p>
              <div className="mt-8">
                <LandingCta />
              </div>
            </div>

            <Parallax speed={0.1} decorative className="relative">
              <div className="surface relative mx-auto max-w-md p-5 shadow-2xl" role="img" aria-label="Preview of the dashboard">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold">Songs per release year</span>
                  <span className="badge badge-ghost badge-sm">Preview</span>
                </div>
                <div className="flex h-36 items-end gap-2">
                  {SPARK.map((h, i) => (
                    <span key={i} className="bar-fill flex-1 rounded-t-md" style={{ height: `${h}%`, opacity: 0.55 + i * 0.06 }} />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[
                    ["25", "Artists"],
                    ["120", "Songs"],
                    ["8", "Gigs"],
                  ].map(([n, l]) => (
                    <div key={l} className="bg-base-200 rounded-xl py-2.5">
                      <div className="text-xl font-bold">{n}</div>
                      <div className="muted text-xs">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <Parallax speed={0.28} className="surface absolute -bottom-6 -left-2 hidden items-center gap-3 p-3 shadow-xl sm:flex">
                <span className="bg-secondary text-secondary-content flex size-10 items-center justify-center rounded-lg">
                  <LuActivity />
                </span>
                <span className="text-sm leading-tight">
                  <strong className="block">New gig confirmed</strong>
                  <span className="muted">Riverside Hall, Friday</span>
                </span>
              </Parallax>
            </Parallax>
          </div>
        </section>

        <section id="features" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:py-20">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight">Everything a roster needs</h2>
            <p className="muted mt-2 max-w-2xl">From the first signed artist to the last encore, the tools sit side by side instead of in six different spreadsheets.</p>
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal as="li" key={f.title} delay={(i % 3) * 90} className="surface p-6 transition-shadow hover:shadow-lg">
                <span className="bg-primary/10 text-primary mb-4 flex size-11 items-center justify-center rounded-xl text-xl">{f.icon}</span>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="muted mt-1.5 text-sm leading-relaxed">{f.text}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        <section id="roles" className="bg-base-200 relative scroll-mt-20 overflow-hidden">
          <Parallax speed={0.16} className="pointer-events-none absolute right-0 -bottom-24 size-96 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight">The right access for every person</h2>
              <p className="muted mt-2 max-w-2xl">Three roles, enforced on every screen and every request.</p>
            </Reveal>
            <ul className="mt-10 grid gap-5 md:grid-cols-3">
              {ROLES.map((r, i) => (
                <Reveal as="li" key={r.name} from={i === 0 ? "left" : i === 2 ? "right" : undefined} delay={i * 80} className="surface p-6">
                  <span className="bg-secondary/10 text-secondary mb-4 flex size-11 items-center justify-center rounded-xl text-xl">{r.icon}</span>
                  <h3 className="text-lg font-semibold">{r.name}</h3>
                  <p className="muted mt-1.5 text-sm leading-relaxed">{r.text}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <Reveal className="hero-gradient border-base-300 rounded-3xl border p-8 text-center sm:p-14">
            <h2 className="text-3xl font-bold tracking-tight">Ready to look at your roster?</h2>
            <p className="muted mx-auto mt-2 max-w-xl">Sign in, take the one-minute tour and start with the dashboard.</p>
            <div className="mt-6 flex justify-center">
              <LandingCta />
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-base-300 border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm">
          <span className="muted">Artist Studio - artist and catalogue management</span>
          <nav aria-label="Footer" className="flex gap-4">
            <Link href="/auth/login" className="link link-hover">
              Sign in
            </Link>
            <Link href="/auth/register" className="link link-hover">
              Register
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

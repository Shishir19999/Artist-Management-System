"use client";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { LuCalendar, LuClock, LuMic, LuMusic, LuUsers } from "react-icons/lu";
import { BarList, ColumnChart } from "@/components/charts/Charts";
import { PageHeader, Skeleton } from "@/components/ui/States";
import ActivityList from "@/features/activity/ActivityList";
import { useAuth } from "@/lib/client/auth";
import { formatDateTime, formatTotalDuration } from "@/lib/client/format";
import { useActivity, useArtists, useGigs, useSongs, useUsers } from "@/lib/client/hooks";
import { routes } from "@/lib/client/routes";
import { buildAnalytics } from "@/lib/domain/analytics";
import { GENRE_LABEL } from "@/lib/domain/constants";

function Tile({ icon, label, value, href }: { icon: ReactNode; label: string; value: ReactNode; href: string }) {
    return (
        <Link href={href} className="surface hover:border-primary flex items-center gap-4 p-4 transition-colors">
            <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl text-xl">{icon}</span>
            <span className="min-w-0">
                <span className="muted block text-sm">{label}</span>
                <span className="block text-2xl font-bold tabular-nums">{value}</span>
            </span>
        </Link>
    );
}

function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
    return (
        <section className="surface p-5" aria-label={title}>
            <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const artists = useArtists();
    const songs = useSongs();
    const gigs = useGigs();
    const users = useUsers(isAdmin);
    const activity = useActivity({ limit: 8 });

    const loading = artists.loading || songs.loading || gigs.loading;
    const error = artists.error || songs.error || gigs.error;

    const analytics = useMemo(
        () =>
            buildAnalytics({
                artists: artists.artists,
                songs: songs.songs,
                gigs: gigs.gigs,
                userCount: isAdmin ? users.users.length : null,
            }),
        [artists.artists, songs.songs, gigs.gigs, users.users, isAdmin]
    );

    const firstName = (user?.name ?? "").split(" ")[0] || "there";

    return (
        <>
            <PageHeader title={`Welcome back, ${firstName}`} subtitle="Here is how your roster and catalogue look today." />

            {error ? (
                <div role="alert" className="alert alert-error alert-soft">
                    {error}
                </div>
            ) : loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading dashboard">
                    {Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} className="h-20" />
                    ))}
                    <Skeleton className="h-72 sm:col-span-2" />
                    <Skeleton className="h-72 sm:col-span-2" />
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Tile icon={<LuMic aria-hidden />} label="Artists" value={analytics.totals.artists} href={routes.artists} />
                        <Tile icon={<LuMusic aria-hidden />} label="Songs" value={analytics.totals.songs} href={routes.music} />
                        {analytics.totals.users !== null ? (
                            <Tile icon={<LuUsers aria-hidden />} label="Users" value={analytics.totals.users} href={routes.users} />
                        ) : (
                            <Tile
                                icon={<LuClock aria-hidden />}
                                label="Total runtime"
                                value={formatTotalDuration(analytics.totals.totalDurationSec)}
                                href={routes.music}
                            />
                        )}
                        <Tile icon={<LuCalendar aria-hidden />} label="Upcoming gigs" value={analytics.totals.upcomingGigs} href={routes.calendar} />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Artists by genre">
                            <BarList
                                data={analytics.artistsByGenre.map((d) => ({ label: GENRE_LABEL[d.genre], value: d.count }))}
                                labelHeader="Genre"
                                valueLabel="Artists"
                                emptyText="Add songs to see the genre mix"
                            />
                        </Card>
                        <Card title="Songs per release year">
                            <ColumnChart
                                data={analytics.songsPerYear.map((d) => ({ label: String(d.year), value: d.count }))}
                                labelHeader="Year"
                                valueLabel="Songs"
                                emptyText="Songs with a release date appear here"
                            />
                        </Card>
                        <Card title="Top artists by songs">
                            <BarList
                                data={analytics.topArtists.map((d) => ({ label: d.name, value: d.songs }))}
                                labelHeader="Artist"
                                valueLabel="Songs"
                                emptyText="No songs yet"
                            />
                        </Card>
                        <Card
                            title="Upcoming gigs"
                            action={
                                <Link href={routes.calendar} className="link link-primary text-sm">
                                    Open calendar
                                </Link>
                            }
                        >
                            {analytics.upcomingGigs.length === 0 ? (
                                <p className="muted py-8 text-center text-sm">No upcoming gigs</p>
                            ) : (
                                <ul className="flex flex-col">
                                    {analytics.upcomingGigs.map((g) => (
                                        <li key={g.id} className="border-base-300 flex items-start justify-between gap-3 border-b py-2.5 last:border-0">
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium">{g.title}</span>
                                                <span className="muted block truncate text-xs">
                                                    {artists.byId.get(g.artistId)?.name ?? "Artist"} - {g.venue}
                                                    {g.city ? `, ${g.city}` : ""}
                                                </span>
                                            </span>
                                            <time className="muted shrink-0 text-xs" dateTime={g.date}>
                                                {formatDateTime(g.date)}
                                            </time>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </div>

                    <Card
                        title="Recent activity"
                        action={
                            <Link href={routes.activity} className="link link-primary text-sm">
                                View all
                            </Link>
                        }
                    >
                        {activity.loading ? (
                            <Skeleton className="h-24" />
                        ) : activity.activity.length === 0 ? (
                            <p className="muted py-6 text-center text-sm">Nothing has happened yet</p>
                        ) : (
                            <ActivityList items={activity.activity} showUser={isAdmin} />
                        )}
                    </Card>
                </div>
            )}
        </>
    );
}

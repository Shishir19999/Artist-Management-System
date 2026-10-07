"use client";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { LuArrowRight, LuMic, LuMusic, LuUserRound, LuUsers } from "react-icons/lu";
import { BarList, ColumnChart } from "@/components/charts/Charts";
import { PlayButton, type PlayItem } from "@/components/player/Player";
import { Avatar, CoverArt } from "@/components/ui/Art";
import { PageHeader, Skeleton } from "@/components/ui/States";
import ActivityList from "@/features/activity/ActivityList";
import { useAuth } from "@/lib/client/auth";
import { formatDateTime, formatDuration, formatTotalDuration } from "@/lib/client/format";
import { useActivity, useArtists, useGigs, useSongs, useUsers } from "@/lib/client/hooks";
import { DASHBOARD_CARDS } from "@/lib/client/role-policy";
import { routes } from "@/lib/client/routes";
import { buildAnalytics } from "@/lib/domain/analytics";
import { GENRE_LABEL, ROLE_LABEL } from "@/lib/domain/constants";
import { ROLES } from "@/lib/roles";

/** One dashboard card in the owner's layout: icon, big count, a short chart and a link to the page. */
function StatCard({
    icon,
    title,
    count,
    caption,
    href,
    linkLabel,
    children,
}: {
    icon: ReactNode;
    title: string;
    count: ReactNode;
    caption: string;
    href: string;
    linkLabel: string;
    children?: ReactNode;
}) {
    return (
        <section className="surface flex flex-col gap-4 p-5" aria-label={title}>
            <div className="flex items-center gap-4">
                <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl text-xl" aria-hidden>
                    {icon}
                </span>
                <div className="min-w-0">
                    <h2 className="muted text-sm font-medium">{title}</h2>
                    <p className="text-3xl leading-tight font-bold tabular-nums">{count}</p>
                    <p className="muted text-xs">{caption}</p>
                </div>
            </div>
            <div className="flex-1">{children}</div>
            <Link href={href} className="link link-primary inline-flex min-h-11 items-center gap-1 text-sm font-medium">
                {linkLabel} <LuArrowRight aria-hidden />
            </Link>
        </section>
    );
}

function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
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

const COLS: Record<number, string> = { 1: "grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-2 xl:grid-cols-3" };

export default function Dashboard() {
    const { user } = useAuth();
    const role = user?.role ?? "USER";
    const isManager = role === "ARTIST_MANAGER";
    const isArtist = role === "ARTIST";
    const artists = useArtists();
    const songs = useSongs();
    const gigs = useGigs();
    const users = useUsers(isManager);
    const activity = useActivity({ limit: 6 });

    const loading = artists.loading || songs.loading || (isManager && users.loading);
    const error = artists.error || songs.error;

    const myArtist = isArtist ? artists.artists.find((a) => a.createdBy === user?.id) : undefined;
    const mySongs = useMemo(() => (myArtist ? songs.songs.filter((s) => s.artistId === myArtist.id) : []), [songs.songs, myArtist]);

    const analytics = useMemo(
        () =>
            buildAnalytics({
                artists: artists.artists,
                songs: songs.songs,
                gigs: isArtist && myArtist ? gigs.gigs.filter((g) => g.artistId === myArtist.id) : gigs.gigs,
                userCount: isManager ? users.users.length : null,
            }),
        [artists.artists, songs.songs, gigs.gigs, users.users, isManager, isArtist, myArtist]
    );

    const newest: PlayItem[] = useMemo(
        () =>
            [...songs.songs]
                .sort((a, b) => b.created_at.localeCompare(a.created_at) || (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""))
                .slice(0, 6)
                .map((song) => ({ song, artistName: song.artistName ?? (song.artistId ? (artists.byId.get(song.artistId)?.name ?? "") : "") })),
        [songs.songs, artists.byId]
    );

    const roleCounts = useMemo(() => ROLES.map((r) => ({ label: ROLE_LABEL[r], value: users.users.filter((u) => u.role === r).length })), [users.users]);

    const firstName = (user?.name ?? "").split(" ")[0] || "there";
    const cards = DASHBOARD_CARDS[role];
    const heading = isManager ? "Studio overview" : isArtist ? `Hello, ${firstName}` : `Welcome, ${firstName}`;
    const subtitle = isManager
        ? "Everyone and everything in the workspace at a glance."
        : isArtist
          ? "Your profile and your music, with everything coming up."
          : "Find something to listen to.";

    const cardNodes: Record<(typeof cards)[number], ReactNode> = {
        users: (
            <StatCard key="users" icon={<LuUsers />} title="Users" count={analytics.totals.users ?? 0} caption="accounts in the workspace" href={routes.users} linkLabel="Manage users">
                <BarList data={roleCounts} labelHeader="Role" valueLabel="Users" emptyText="No users yet" />
            </StatCard>
        ),
        artists: (
            <StatCard key="artists" icon={<LuMic />} title="Artists" count={analytics.totals.artists} caption="on the roster" href={routes.artists} linkLabel="Manage artists">
                <BarList
                    data={analytics.artistsByGenre.slice(0, 4).map((d) => ({ label: GENRE_LABEL[d.genre], value: d.count }))}
                    labelHeader="Genre"
                    valueLabel="Artists"
                    emptyText="Add music to see the genre mix"
                />
            </StatCard>
        ),
        profile: (
            <StatCard
                key="profile"
                icon={<LuUserRound />}
                title="My Profile"
                count={myArtist?.name ?? "No profile yet"}
                caption={myArtist ? `${mySongs.length} track${mySongs.length === 1 ? "" : "s"} published` : "Your artist page is being set up"}
                href={myArtist ? routes.artistShow(myArtist.id) : routes.profile}
                linkLabel="Open my profile"
            >
                {myArtist && (
                    <div className="flex items-center gap-3">
                        <Avatar name={myArtist.name} src={myArtist.photo} size="lg" rounded="xl" />
                        <p className="muted line-clamp-3 text-sm">{myArtist.bio || "Add a short biography so people know who you are."}</p>
                    </div>
                )}
            </StatCard>
        ),
        music: (
            <StatCard
                key="music"
                icon={<LuMusic />}
                title="Music"
                count={analytics.totals.songs}
                caption={`${formatTotalDuration(analytics.totals.totalDurationSec)} of music`}
                href={routes.music}
                linkLabel={isManager ? "Manage music" : "Browse music"}
            >
                <ColumnChart
                    data={analytics.songsPerYear.slice(-12).map((d) => ({ label: String(d.year), value: d.count }))}
                    labelHeader="Year"
                    valueLabel="Tracks"
                    emptyText="Tracks with a release date appear here"
                />
            </StatCard>
        ),
    };

    return (
        <>
            <PageHeader title={heading} subtitle={subtitle} />

            {error ? (
                <div role="alert" className="alert alert-error alert-soft">
                    {error}
                </div>
            ) : loading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading dashboard">
                    {cards.map((c) => (
                        <Skeleton key={c} className="h-72" />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className={`grid gap-4 ${COLS[cards.length]}`}>{cards.map((c) => cardNodes[c])}</div>

                    {(isManager || isArtist) && (
                        <div className={`grid gap-4 ${isManager ? "lg:grid-cols-2" : ""}`}>
                            <Panel
                                title={isArtist ? "My upcoming gigs" : "Upcoming gigs"}
                                action={
                                    <Link href={routes.calendar} className="link link-primary inline-flex min-h-11 items-center text-sm">
                                        Open calendar
                                    </Link>
                                }
                            >
                                {analytics.upcomingGigs.length === 0 ? (
                                    <p className="muted py-8 text-center text-sm">{isArtist ? "No gigs booked yet" : "No upcoming gigs"}</p>
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
                            </Panel>
                            {isManager && (
                                <Panel
                                    title="Recent activity"
                                    action={
                                        <Link href={routes.activity} className="link link-primary inline-flex min-h-11 items-center text-sm">
                                            View all
                                        </Link>
                                    }
                                >
                                    {activity.loading ? (
                                        <Skeleton className="h-24" />
                                    ) : activity.activity.length === 0 ? (
                                        <p className="muted py-6 text-center text-sm">Nothing has happened yet</p>
                                    ) : (
                                        <ActivityList items={activity.activity} showUser />
                                    )}
                                </Panel>
                            )}
                        </div>
                    )}

                    {role === "USER" && (
                        <Panel
                            title="Recently added"
                            action={
                                <Link href={routes.music} className="link link-primary inline-flex min-h-11 items-center text-sm">
                                    See all music
                                </Link>
                            }
                        >
                            {newest.length === 0 ? (
                                <p className="muted py-6 text-center text-sm">No music has been published yet</p>
                            ) : (
                                <ul className="divide-base-300 divide-y">
                                    {newest.map((item, i) => (
                                        <li key={item.song.id} className="flex items-center gap-3 py-2">
                                            <PlayButton queue={newest} index={i} />
                                            <CoverArt title={item.song.title} src={item.song.coverUrl} size="xs" />
                                            <Link href={routes.musicShow(item.song.id)} className="min-w-0 flex-1 truncate font-medium hover:underline">
                                                {item.song.title}
                                                <span className="muted block truncate text-xs font-normal">{item.artistName}</span>
                                            </Link>
                                            <span className="muted text-sm tabular-nums">{formatDuration(item.song.durationSec)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    )}
                </div>
            )}
        </>
    );
}

"use client";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { LuCalendarPlus, LuExternalLink, LuGlobe, LuInstagram, LuMapPin, LuMusic, LuPencil, LuPlus, LuTrash2, LuYoutube } from "react-icons/lu";
import FavoriteButton from "@/components/Favorite";
import { PlayButton, type PlayItem } from "@/components/player/Player";
import { Avatar, CoverArt } from "@/components/ui/Art";
import { useConfirm } from "@/components/ui/Confirm";
import { BackLink, LoadState } from "@/components/ui/DetailGate";
import { EmptyState, PageHeader } from "@/components/ui/States";
import GigDialog, { STATUS_BADGE, STATUS_LABEL } from "@/features/calendar/GigDialog";
import { useAuth } from "@/lib/client/auth";
import { formatDate, formatDateTime, formatDuration, formatMoney, formatTotalDuration } from "@/lib/client/format";
import { useSongs } from "@/lib/client/hooks";
import { routes } from "@/lib/client/routes";
import { invalidate, useApi } from "@/lib/client/use-api";
import { GENRE_LABEL } from "@/lib/domain/constants";
import type { ArtistDTO, GigDTO } from "@/lib/domain/types";
import { handleError } from "@/utils/errorsHandle";
import { showError, showSucces } from "@/utils/notify";

function SocialLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm gap-2">
            {icon} {label} <span className="sr-only">(opens in a new tab)</span>
        </a>
    );
}

export default function ArtistProfile({ id }: { id: string }) {
    const router = useRouter();
    const { user } = useAuth();
    const canManage = user?.role !== "USER";
    const confirm = useConfirm();
    const artistReq = useApi<{ artist: ArtistDTO }>(`/api/artists/${id}`);
    const gigsReq = useApi<{ gigs: GigDTO[] }>(`/api/gigs?artistId=${encodeURIComponent(id)}`);
    const { songs } = useSongs();
    const [gigOpen, setGigOpen] = useState(false);
    const [editing, setEditing] = useState<GigDTO | undefined>();
    const [now] = useState(() => Date.now());

    const artist = artistReq.data?.artist;
    const mine = useMemo(
        () => songs.filter((s) => s.artistId === id).sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "")),
        [songs, id]
    );
    const queue: PlayItem[] = useMemo(() => mine.map((song) => ({ song, artistName: artist?.name ?? "" })), [mine, artist?.name]);
    const albums = useMemo(() => {
        const map = new Map<string, number[]>();
        mine.forEach((s, i) => {
            const key = s.album || "Singles";
            map.set(key, [...(map.get(key) ?? []), i]);
        });
        return [...map];
    }, [mine]);

    if (!artist) {
        return <LoadState loading={artistReq.loading} error={artistReq.error ?? "Artist not found"} onRetry={artistReq.reload} notFound="This artist does not exist or is not shared with you." />;
    }

    const gigs = gigsReq.data?.gigs ?? [];
    const upcoming = gigs.filter((g) => Date.parse(g.date) >= now && g.status !== "CANCELLED");
    const past = gigs.filter((g) => !upcoming.includes(g)).reverse();
    const totalSec = mine.reduce((n, s) => n + (s.durationSec ?? 0), 0);

    const remove = async () => {
        const ok = await confirm({
            title: `Delete ${artist.name}?`,
            message: "Their songs stay in the catalogue but lose the artist link, and their gigs are removed.",
            confirmLabel: "Delete",
        });
        if (!ok) return;
        try {
            await axios.delete(`/api/artists/${artist.id}`);
            invalidate();
            showSucces("Artist deleted");
            router.push(routes.artists);
        } catch (e) {
            showError(handleError(e));
        }
    };

    const openGig = (g?: GigDTO) => {
        setEditing(g);
        setGigOpen(true);
    };

    return (
        <>
            <PageHeader
                back={<BackLink href={routes.artists}>All artists</BackLink>}
                title={artist.name}
                subtitle={
                    artist.address ? (
                        <span className="inline-flex items-center gap-1">
                            <LuMapPin aria-hidden /> {artist.address}
                        </span>
                    ) : undefined
                }
                actions={
                    <>
                        <FavoriteButton type="ARTIST" id={artist.id} name={artist.name} size="md" />
                        {canManage && (
                            <>
                                <Link href={routes.artistEdit(artist.id)} className="btn btn-outline gap-2">
                                    <LuPencil aria-hidden /> Edit
                                </Link>
                                <button type="button" className="btn btn-ghost text-error gap-2" onClick={() => void remove()}>
                                    <LuTrash2 aria-hidden /> Delete
                                </button>
                            </>
                        )}
                    </>
                }
            />

            <div className="grid gap-5 lg:grid-cols-3">
                <section className="surface flex flex-col gap-4 p-5 lg:col-span-1" aria-label="Profile">
                    <div className="flex items-center gap-4">
                        <Avatar name={artist.name} src={artist.photo} size="xl" rounded="xl" />
                        <dl className="text-sm">
                            <dt className="sr-only">Gender</dt>
                            <dd className="badge badge-ghost mb-1">{artist.gender.toLowerCase()}</dd>
                            <dt className="muted text-xs">First release</dt>
                            <dd className="font-semibold">{artist.first_release_year ?? "-"}</dd>
                            <dt className="muted mt-1 text-xs">Albums</dt>
                            <dd className="font-semibold">{artist.total_albums ?? 0}</dd>
                        </dl>
                    </div>
                    {artist.bio ? <p className="text-sm leading-relaxed">{artist.bio}</p> : <p className="muted text-sm">No biography yet.</p>}
                    {artist.email && <p className="muted text-sm break-all">{artist.email}</p>}
                    <div className="flex flex-wrap gap-2">
                        {artist.website && <SocialLink href={artist.website} icon={<LuGlobe aria-hidden />} label="Website" />}
                        {artist.instagram && <SocialLink href={`https://instagram.com/${artist.instagram.replace(/^@/, "")}`} icon={<LuInstagram aria-hidden />} label={artist.instagram} />}
                        {artist.youtube && <SocialLink href={artist.youtube} icon={<LuYoutube aria-hidden />} label="YouTube" />}
                        {artist.spotify && <SocialLink href={artist.spotify} icon={<LuExternalLink aria-hidden />} label="Spotify" />}
                    </div>
                    <p className="muted text-xs">Added {formatDate(artist.created_at)}</p>
                </section>

                <section className="surface p-5 lg:col-span-2" aria-label="Discography">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-base font-semibold">Discography</h2>
                            <p className="muted text-xs">
                                {mine.length} song{mine.length === 1 ? "" : "s"}
                                {mine.length > 0 && ` · ${formatTotalDuration(totalSec)}`}
                            </p>
                        </div>
                        {canManage && (
                            <Link href={routes.musicNew} className="btn btn-primary btn-sm gap-1.5">
                                <LuPlus aria-hidden /> Add song
                            </Link>
                        )}
                    </div>
                    {albums.length === 0 ? (
                        <EmptyState icon={<LuMusic size={26} />} title="No songs yet" message={canManage ? "Add the first song to start the discography." : "This artist has no songs yet."} />
                    ) : (
                        <div className="flex flex-col gap-5">
                            {albums.map(([album, idxs]) => (
                                <div key={album}>
                                    <h3 className="muted mb-1 text-sm font-semibold">{album}</h3>
                                    <ul className="divide-base-300 divide-y">
                                        {idxs.map((i) => {
                                            const s = mine[i];
                                            return (
                                                <li key={s.id} className="flex items-center gap-3 py-2">
                                                    <PlayButton queue={queue} index={i} />
                                                    <CoverArt title={s.title} src={s.coverUrl} size="xs" />
                                                    <Link href={routes.musicShow(s.id)} className="min-w-0 flex-1 truncate font-medium hover:underline">
                                                        {s.title}
                                                    </Link>
                                                    <span className="badge badge-ghost hidden sm:inline-flex">{GENRE_LABEL[s.genre]}</span>
                                                    <span className="muted w-14 text-right text-sm tabular-nums">{formatDuration(s.durationSec)}</span>
                                                    <FavoriteButton type="SONG" id={s.id} name={s.title} size="xs" />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="surface p-5 lg:col-span-3" aria-label="Gigs and bookings">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-semibold">Gigs and bookings</h2>
                        <span className="flex gap-2">
                            <Link href={routes.calendar} className="btn btn-ghost btn-sm">
                                Open calendar
                            </Link>
                            {canManage && (
                                <button type="button" className="btn btn-outline btn-sm gap-1.5" onClick={() => openGig()}>
                                    <LuCalendarPlus aria-hidden /> Add gig
                                </button>
                            )}
                        </span>
                    </div>
                    {gigsReq.loading ? (
                        <p className="muted text-sm" role="status">
                            Loading gigs
                        </p>
                    ) : gigs.length === 0 ? (
                        <EmptyState icon={<LuCalendarPlus size={26} />} title="No gigs booked" message="Upcoming and past bookings appear here." />
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            {(
                                [
                                    ["Upcoming", upcoming],
                                    ["Past and cancelled", past],
                                ] as [string, GigDTO[]][]
                            ).map(([label, list]) => (
                                <div key={label}>
                                    <h3 className="muted mb-1 text-sm font-semibold">{label}</h3>
                                    {list.length === 0 ? (
                                        <p className="muted text-sm">None</p>
                                    ) : (
                                        <ul className="divide-base-300 divide-y">
                                            {list.map((g) => (
                                                <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                                                    <div className="min-w-0">
                                                        <p className="font-medium">{g.title}</p>
                                                        <p className="muted text-xs">
                                                            {formatDateTime(g.date)} · {g.venue}
                                                            {g.city ? `, ${g.city}` : ""}
                                                            {g.fee != null ? ` · ${formatMoney(g.fee)}` : ""}
                                                        </p>
                                                    </div>
                                                    <span className="flex items-center gap-1">
                                                        <span className={`badge ${STATUS_BADGE[g.status]}`}>{STATUS_LABEL[g.status]}</span>
                                                        {canManage && (
                                                            <button type="button" className="btn btn-ghost btn-xs btn-circle" aria-label={`Edit ${g.title}`} onClick={() => openGig(g)}>
                                                                <LuPencil aria-hidden />
                                                            </button>
                                                        )}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {canManage && <GigDialog open={gigOpen} onClose={() => setGigOpen(false)} gig={editing} artists={[artist]} defaultArtistId={artist.id} />}
        </>
    );
}

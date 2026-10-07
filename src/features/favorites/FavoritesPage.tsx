"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { LuHeart } from "react-icons/lu";
import FavoriteButton from "@/components/Favorite";
import { PlayButton, type PlayItem } from "@/components/player/Player";
import { Avatar, CoverArt } from "@/components/ui/Art";
import { EmptyState, ErrorState, PageHeader, SkeletonRows } from "@/components/ui/States";
import { formatDuration } from "@/lib/client/format";
import { useArtists, useFavorites, useSongs } from "@/lib/client/hooks";
import { routes } from "@/lib/client/routes";

export default function FavoritesPage() {
    const favs = useFavorites();
    const { byId: artistById, loading: la } = useArtists();
    const { byId: songById, loading: ls } = useSongs();
    const [tab, setTab] = useState<"ARTIST" | "SONG">("ARTIST");

    const artists = useMemo(() => favs.favorites.filter((f) => f.targetType === "ARTIST").map((f) => artistById.get(f.targetId)).filter((a) => !!a), [favs.favorites, artistById]);
    const songs = useMemo(() => favs.favorites.filter((f) => f.targetType === "SONG").map((f) => songById.get(f.targetId)).filter((s) => !!s), [favs.favorites, songById]);
    const queue: PlayItem[] = useMemo(() => songs.map((song) => ({ song: song!, artistName: song!.artistId ? (artistById.get(song!.artistId)?.name ?? "") : "" })), [songs, artistById]);

    const loading = favs.loading || la || ls;

    return (
        <>
            <PageHeader title="Favorites" subtitle="Artists and songs you have starred." />
            <div role="tablist" className="tabs tabs-box mb-4 w-fit">
                {(["ARTIST", "SONG"] as const).map((t) => (
                    <button key={t} role="tab" type="button" aria-selected={tab === t} className={`tab ${tab === t ? "tab-active" : ""}`} onClick={() => setTab(t)}>
                        {t === "ARTIST" ? `Artists (${artists.length})` : `Songs (${songs.length})`}
                    </button>
                ))}
            </div>
            <div className="surface">
                {loading ? (
                    <div className="p-5">
                        <SkeletonRows rows={4} />
                    </div>
                ) : favs.error ? (
                    <ErrorState message={favs.error} onRetry={favs.reload} />
                ) : (tab === "ARTIST" ? artists.length : songs.length) === 0 ? (
                    <EmptyState
                        icon={<LuHeart size={26} />}
                        title={`No favorite ${tab === "ARTIST" ? "artists" : "songs"}`}
                        message="Use the heart button anywhere to save something here."
                        action={
                            <Link href={tab === "ARTIST" ? routes.artists : routes.music} className="btn btn-primary btn-sm">
                                Browse {tab === "ARTIST" ? "artists" : "songs"}
                            </Link>
                        }
                    />
                ) : tab === "ARTIST" ? (
                    <ul className="divide-base-300 divide-y">
                        {artists.map((a) => (
                            <li key={a!.id} className="flex items-center gap-3 p-3">
                                <Avatar name={a!.name} src={a!.photo} size="md" />
                                <Link href={routes.artistShow(a!.id)} className="min-w-0 flex-1 font-medium hover:underline">
                                    {a!.name}
                                    <span className="muted block text-xs font-normal">{a!.address}</span>
                                </Link>
                                <FavoriteButton type="ARTIST" id={a!.id} name={a!.name} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="divide-base-300 divide-y">
                        {songs.map((s, i) => (
                            <li key={s!.id} className="flex items-center gap-3 p-3">
                                <PlayButton queue={queue} index={i} />
                                <CoverArt title={s!.title} src={s!.coverUrl} size="sm" />
                                <Link href={routes.musicShow(s!.id)} className="min-w-0 flex-1 truncate font-medium hover:underline">
                                    {s!.title}
                                    <span className="muted block truncate text-xs font-normal">{queue[i].artistName}</span>
                                </Link>
                                <span className="muted text-sm tabular-nums">{formatDuration(s!.durationSec)}</span>
                                <FavoriteButton type="SONG" id={s!.id} name={s!.title} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

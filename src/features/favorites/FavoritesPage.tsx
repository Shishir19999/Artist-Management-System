"use client";
import Link from "next/link";
import { useMemo } from "react";
import { LuHeart } from "react-icons/lu";
import FavoriteButton from "@/components/Favorite";
import { PlayButton, type PlayItem } from "@/components/player/Player";
import { CoverArt } from "@/components/ui/Art";
import { EmptyState, ErrorState, PageHeader, SkeletonRows } from "@/components/ui/States";
import { formatDuration } from "@/lib/client/format";
import { useArtists, useFavorites, useSongs } from "@/lib/client/hooks";
import { routes } from "@/lib/client/routes";

export default function FavoritesPage() {
    const favs = useFavorites();
    const { byId: artistById, loading: la } = useArtists();
    const { byId: songById, loading: ls } = useSongs();

    const songs = useMemo(
        () => favs.favorites.filter((f) => f.targetType === "SONG").map((f) => songById.get(f.targetId)).filter((s) => !!s),
        [favs.favorites, songById]
    );
    const queue: PlayItem[] = useMemo(
        () => songs.map((song) => ({ song: song!, artistName: song!.artistName ?? (song!.artistId ? (artistById.get(song!.artistId)?.name ?? "") : "") })),
        [songs, artistById]
    );
    const loading = favs.loading || la || ls;

    return (
        <>
            <PageHeader title="Favorites" subtitle="The music you have starred." />
            <section className="surface" aria-label="Favorite music">
                {loading ? (
                    <div className="p-5">
                        <SkeletonRows rows={4} />
                    </div>
                ) : favs.error ? (
                    <ErrorState message={favs.error} onRetry={favs.reload} />
                ) : songs.length === 0 ? (
                    <EmptyState
                        icon={<LuHeart size={26} />}
                        title="No favorites yet"
                        message="Tap the heart next to any track and it will wait for you here."
                        action={
                            <Link href={routes.music} className="btn btn-primary btn-sm min-h-11">
                                Browse music
                            </Link>
                        }
                    />
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
            </section>
        </>
    );
}

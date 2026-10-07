"use client";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuListPlus, LuPencil, LuTrash2 } from "react-icons/lu";
import FavoriteButton from "@/components/Favorite";
import { PlayButton } from "@/components/player/Player";
import { CoverArt } from "@/components/ui/Art";
import { useConfirm } from "@/components/ui/Confirm";
import { BackLink, LoadState } from "@/components/ui/DetailGate";
import { PageHeader } from "@/components/ui/States";
import AddToPlaylist from "@/features/playlists/AddToPlaylist";
import NotAvailable from "@/components/shell/NotAvailable";
import { useAuth } from "@/lib/client/auth";
import { formatDate, formatDuration } from "@/lib/client/format";
import { useOwnArtistId } from "@/lib/client/hooks";
import { canEditSong, canOpenPage } from "@/lib/client/role-policy";
import { routes } from "@/lib/client/routes";
import { invalidate, useApi } from "@/lib/client/use-api";
import { GENRE_LABEL } from "@/lib/domain/constants";
import type { SongDTO } from "@/lib/domain/types";
import { handleError } from "@/utils/errorsHandle";
import { showError, showSucces } from "@/utils/notify";
import SongForm from "./SongForm";

type SongWithArtist = SongDTO & { artist?: { name: string } | null };

export function SongEdit({ id }: { id: string }) {
    const { user } = useAuth();
    const ownArtistId = useOwnArtistId();
    const req = useApi<{ music: SongWithArtist }>(`/api/musics/${id}`);
    const song = req.data?.music;
    if (!song) return <LoadState loading={req.loading} error={req.error ?? "Track not found"} onRetry={req.reload} notFound="This song does not exist." />;
    if (user && !canEditSong(user, song, ownArtistId)) return <NotAvailable role={user.role} />;
    return (
        <>
            <PageHeader back={<BackLink href={routes.musicShow(id)}>Back to track</BackLink>} title={`Edit ${song.title}`} />
            <SongForm key={song.updated_at} song={song} />
        </>
    );
}

export default function SongDetail({ id }: { id: string }) {
    const router = useRouter();
    const { user } = useAuth();
    const role = user?.role ?? "USER";
    const ownArtistId = useOwnArtistId();
    const confirm = useConfirm();
    const req = useApi<{ music: SongWithArtist }>(`/api/musics/${id}`);
    const [adding, setAdding] = useState(false);
    const song = req.data?.music;
    if (!song) return <LoadState loading={req.loading} error={req.error ?? "Track not found"} onRetry={req.reload} notFound="This track does not exist." />;

    const canManage = !!user && canEditSong(user, song, ownArtistId);
    const withPlaylists = true;
    const remove = async () => {
        const ok = await confirm({ title: `Delete ${song.title}?`, message: "It is also removed from playlists and favorites.", confirmLabel: "Delete" });
        if (!ok) return;
        try {
            await axios.delete(`/api/musics/${song.id}`);
            invalidate();
            showSucces("Music deleted");
            router.push(routes.music);
        } catch (e) {
            showError(handleError(e));
        }
    };

    const artistName = song.artist?.name ?? "";
    const rows: [string, React.ReactNode][] = [
        ["Artist", song.artistId && canOpenPage(role, routes.artistShow("x")) ? <Link key="a" href={routes.artistShow(song.artistId)} className="link link-hover">{artistName || "View artist"}</Link> : artistName || "-"],
        ["Album", song.album || "-"],
        ["Genre", GENRE_LABEL[song.genre]],
        ["Duration", formatDuration(song.durationSec)],
        ["Released", formatDate(song.releaseDate)],
        ["Added", formatDate(song.created_at)],
    ];

    return (
        <>
            <PageHeader
                back={<BackLink href={routes.music}>All music</BackLink>}
                title={song.title}
                subtitle={artistName || undefined}
                actions={
                    <>
                        <FavoriteButton type="SONG" id={song.id} name={song.title} size="md" />
                        {withPlaylists && (
                            <button type="button" className="btn btn-outline gap-2" onClick={() => setAdding(true)}>
                                <LuListPlus aria-hidden /> Add to playlist
                            </button>
                        )}
                        {canManage && (
                            <>
                                <Link href={routes.musicEdit(song.id)} className="btn btn-outline gap-2">
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
            <div className="surface flex flex-col gap-6 p-5 sm:flex-row sm:p-6">
                <CoverArt title={song.title} src={song.coverUrl} size="xl" className="self-start" />
                <div className="flex-1">
                    <div className="mb-4 flex items-center gap-3">
                        <PlayButton queue={[{ song, artistName }]} index={0} size="md" />
                        <span className="muted text-sm">Preview a short clip</span>
                    </div>
                    <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                        {rows.map(([k, v]) => (
                            <div key={k}>
                                <dt className="muted text-xs">{k}</dt>
                                <dd className="font-medium">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
            <AddToPlaylist songs={[song]} open={adding} onClose={() => setAdding(false)} />
        </>
    );
}

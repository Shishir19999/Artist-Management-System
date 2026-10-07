"use client";
import axios from "axios";
import Link from "next/link";
import { useMemo, useState } from "react";
import { LuEye, LuListPlus, LuPencil, LuPlus, LuTrash2, LuUpload } from "react-icons/lu";
import FavoriteButton from "@/components/Favorite";
import { PlayButton, type PlayItem } from "@/components/player/Player";
import { CoverArt } from "@/components/ui/Art";
import { useConfirm } from "@/components/ui/Confirm";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ImportDialog from "@/components/ui/ImportDialog";
import { PageHeader } from "@/components/ui/States";
import AddToPlaylist from "@/features/playlists/AddToPlaylist";
import { useAuth } from "@/lib/client/auth";
import { formatDate, formatDuration } from "@/lib/client/format";
import { useArtists, useSongs } from "@/lib/client/hooks";
import { routes } from "@/lib/client/routes";
import { invalidate } from "@/lib/client/use-api";
import { GENRES, GENRE_LABEL, type GenreKey } from "@/lib/domain/constants";
import { parseDuration } from "@/lib/domain/duration";
import type { SongDTO } from "@/lib/domain/types";
import { showError, showSucces } from "@/utils/notify";

const IMPORT_COLUMNS = [
    { key: "title", label: "Title" },
    { key: "album", label: "Album" },
    { key: "genre", label: "Genre" },
    { key: "artist", label: "Artist" },
    { key: "duration", label: "Duration" },
    { key: "release_date", label: "Release date" },
];

export default function SongsList() {
    const { user } = useAuth();
    const canManage = user?.role !== "USER";
    const { songs, loading, error, reload } = useSongs();
    const { artists, byId } = useArtists();
    const confirm = useConfirm();
    const [importOpen, setImportOpen] = useState(false);
    const [addTo, setAddTo] = useState<SongDTO[] | null>(null);

    const nameOf = (s: SongDTO) => (s.artistId ? (byId.get(s.artistId)?.name ?? "") : "");
    const sorted = useMemo(() => songs, [songs]);
    const queue: PlayItem[] = useMemo(() => sorted.map((song) => ({ song, artistName: song.artistId ? (byId.get(song.artistId)?.name ?? "") : "" })), [sorted, byId]);
    const indexOf = useMemo(() => new Map(sorted.map((s, i) => [s.id, i])), [sorted]);

    const remove = async (list: SongDTO[], clear?: () => void) => {
        const ok = await confirm({
            title: list.length === 1 ? `Delete ${list[0].title}?` : `Delete ${list.length} songs?`,
            message: "They are also removed from playlists and favorites. This cannot be undone.",
            confirmLabel: "Delete",
        });
        if (!ok) return;
        const results = await Promise.allSettled(list.map((s) => axios.delete(`/api/musics/${s.id}`)));
        const failed = results.filter((r) => r.status === "rejected").length;
        invalidate();
        clear?.();
        if (failed) showError(`${failed} of ${list.length} could not be deleted`);
        else showSucces(list.length === 1 ? "Song deleted" : `${list.length} songs deleted`);
    };

    const columns: Column<SongDTO>[] = [
        {
            key: "title",
            header: "Song",
            accessor: (s) => s.title,
            cell: (s) => (
                <span className="flex min-w-48 items-center gap-3">
                    <PlayButton queue={queue} index={indexOf.get(s.id) ?? 0} size="xs" />
                    <CoverArt title={s.title} src={s.coverUrl} size="xs" />
                    <Link href={routes.musicShow(s.id)} className="font-medium hover:underline">
                        {s.title}
                    </Link>
                </span>
            ),
        },
        {
            key: "artist",
            header: "Artist",
            accessor: nameOf,
            cell: (s) =>
                s.artistId ? (
                    <Link href={routes.artistShow(s.artistId)} className="hover:underline">
                        {nameOf(s) || "-"}
                    </Link>
                ) : (
                    "-"
                ),
        },
        { key: "album", header: "Album", accessor: (s) => s.album },
        { key: "genre", header: "Genre", accessor: (s) => GENRE_LABEL[s.genre], cell: (s) => <span className="badge badge-ghost">{GENRE_LABEL[s.genre]}</span> },
        { key: "duration", header: "Length", accessor: (s) => s.durationSec, cell: (s) => formatDuration(s.durationSec), numeric: true },
        { key: "release", header: "Released", accessor: (s) => s.releaseDate, cell: (s) => formatDate(s.releaseDate) },
        { key: "created_at", header: "Added", accessor: (s) => s.created_at, cell: (s) => formatDate(s.created_at), hiddenByDefault: true },
    ];

    const artistByName = new Map(artists.map((a) => [a.name.trim().toLowerCase(), a.id]));

    return (
        <>
            <PageHeader
                title="Songs"
                subtitle={canManage ? "The full catalogue. Press play to preview a clip." : "Songs of the artists shared with you."}
                actions={
                    canManage && (
                        <>
                            <button type="button" className="btn btn-outline gap-2" onClick={() => setImportOpen(true)}>
                                <LuUpload aria-hidden /> Import CSV
                            </button>
                            <Link href={routes.musicNew} className="btn btn-primary gap-2">
                                <LuPlus aria-hidden /> New song
                            </Link>
                        </>
                    )
                }
            />
            <DataTable
                caption="Songs"
                rows={sorted}
                columns={columns}
                getId={(s) => s.id}
                loading={loading}
                error={error}
                onRetry={reload}
                emptyTitle="No songs yet"
                emptyMessage={canManage ? "Add a song or import a CSV file." : "Nothing has been shared with you yet."}
                emptyAction={
                    canManage && (
                        <Link href={routes.musicNew} className="btn btn-primary btn-sm">
                            Add a song
                        </Link>
                    )
                }
                filters={[
                    { key: "genre", label: "Genre", options: GENRES.map((g) => ({ value: g, label: GENRE_LABEL[g] })), match: (s, v) => s.genre === v },
                    {
                        key: "artist",
                        label: "Artist",
                        options: artists.map((a) => ({ value: a.id, label: a.name })).sort((a, b) => a.label.localeCompare(b.label)),
                        match: (s, v) => s.artistId === v,
                    },
                ]}
                selectable
                bulkActions={(sel, clear) => (
                    <>
                        <button type="button" className="btn btn-outline btn-sm gap-1.5" onClick={() => setAddTo(sel)}>
                            <LuListPlus aria-hidden /> Add to playlist
                        </button>
                        {canManage && (
                            <button type="button" className="btn btn-error btn-sm gap-1.5" onClick={() => void remove(sel, clear)}>
                                <LuTrash2 aria-hidden /> Delete selected
                            </button>
                        )}
                    </>
                )}
                csvName="songs"
                storageKey="songs"
                initialSort={{ key: "title", dir: "asc" }}
                rowActions={(s) => (
                    <span className="inline-flex items-center gap-0.5">
                        <FavoriteButton type="SONG" id={s.id} name={s.title} size="xs" />
                        <button type="button" className="btn btn-ghost btn-xs btn-circle" aria-label={`Add ${s.title} to a playlist`} onClick={() => setAddTo([s])}>
                            <LuListPlus aria-hidden />
                        </button>
                        <Link href={routes.musicShow(s.id)} className="btn btn-ghost btn-xs btn-circle" aria-label={`View ${s.title}`}>
                            <LuEye aria-hidden />
                        </Link>
                        {canManage && (
                            <>
                                <Link href={routes.musicEdit(s.id)} className="btn btn-ghost btn-xs btn-circle" aria-label={`Edit ${s.title}`}>
                                    <LuPencil aria-hidden />
                                </Link>
                                <button type="button" className="btn btn-ghost btn-xs btn-circle text-error" aria-label={`Delete ${s.title}`} onClick={() => void remove([s])}>
                                    <LuTrash2 aria-hidden />
                                </button>
                            </>
                        )}
                    </span>
                )}
            />

            <AddToPlaylist songs={addTo ?? []} open={addTo !== null} onClose={() => setAddTo(null)} />

            {canManage && (
                <ImportDialog
                    open={importOpen}
                    onClose={() => setImportOpen(false)}
                    title="Import songs from CSV"
                    hint="Required columns: Title, Album, Genre and Artist (an existing artist name). Duration as m:ss, release date as YYYY-MM-DD. Invalid rows are skipped and reported."
                    columns={IMPORT_COLUMNS}
                    example={{ title: "Example Song", album: "Example Album", genre: "POP", artist: "Luna Marsh", duration: "3:42", release_date: "2024-05-17" }}
                    templateName="songs"
                    mapRow={(r) => {
                        if (!r.title?.trim()) return { error: "Title is required" };
                        const genre = (r.genre || "").toUpperCase().replace(/[^A-Z]/g, "") as GenreKey;
                        const key = GENRES.find((g) => g === genre || GENRE_LABEL[g].toUpperCase().replace(/[^A-Z]/g, "") === genre);
                        if (!key) return { error: `Unknown genre "${r.genre}"` };
                        const artistId = artistByName.get((r.artist ?? "").trim().toLowerCase());
                        if (!artistId) return { error: `Unknown artist "${r.artist ?? ""}"` };
                        const dur = r.duration?.trim() ? parseDuration(r.duration) : null;
                        if (r.duration?.trim() && dur === null) return { error: "Duration must look like 3:42" };
                        if (r.release_date?.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(r.release_date.trim())) return { error: "Release date must be YYYY-MM-DD" };
                        return {
                            payload: {
                                title: r.title.trim(),
                                album: r.album?.trim() ?? "",
                                genre: key,
                                artistId,
                                durationSec: dur ?? undefined,
                                releaseDate: r.release_date?.trim() || undefined,
                            },
                        };
                    }}
                    send={(payload) => axios.post("/api/musics", payload)}
                    onDone={() => invalidate()}
                />
            )}
        </>
    );
}

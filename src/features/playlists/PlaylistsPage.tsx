"use client";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { LuArrowDown, LuArrowUp, LuListMusic, LuPencil, LuPlay, LuPlus, LuTrash2, LuX } from "react-icons/lu";
import { PlayButton, usePlayer, type PlayItem } from "@/components/player/Player";
import { CoverArt } from "@/components/ui/Art";
import { useConfirm } from "@/components/ui/Confirm";
import { TextAreaField, TextField } from "@/components/ui/Fields";
import Modal from "@/components/ui/Modal";
import { EmptyState, ErrorState, PageHeader, SkeletonRows } from "@/components/ui/States";
import { formatDuration, formatTotalDuration } from "@/lib/client/format";
import { useArtists, usePlaylists, useSongs } from "@/lib/client/hooks";
import { routes } from "@/lib/client/routes";
import { invalidate } from "@/lib/client/use-api";
import type { PlaylistDTO } from "@/lib/domain/types";
import { handleError } from "@/utils/errorsHandle";
import { showError, showSucces } from "@/utils/notify";

function PlaylistDialog({ open, onClose, playlist }: { open: boolean; onClose: () => void; playlist?: PlaylistDTO }) {
    const router = useRouter();
    const [name, setName] = useState(playlist?.name ?? "");
    const [description, setDescription] = useState(playlist?.description ?? "");
    const [error, setError] = useState<string>();
    const [busy, setBusy] = useState(false);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return setError("Name is required");
        setBusy(true);
        try {
            if (playlist) {
                await axios.put(`/api/playlists/${playlist.id}`, { name: name.trim(), description: description.trim() || null, songIds: playlist.songIds });
                showSucces("Playlist updated");
            } else {
                const res = await axios.post("/api/playlists", { name: name.trim(), description: description.trim() || null, songIds: [] });
                showSucces("Playlist created");
                router.push(routes.playlist((res.data.playlist as PlaylistDTO).id));
            }
            invalidate("/api/playlists");
            onClose();
        } catch (err) {
            showError(handleError(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={playlist ? "Edit playlist" : "New playlist"} size="sm">
            {open && (
                <form onSubmit={save} noValidate className="flex flex-col gap-4">
                    <TextField label="Name" value={name} onChange={(e) => { setName(e.target.value); setError(undefined); }} error={error} required maxLength={80} />
                    <TextAreaField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} className="min-h-20" />
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={busy}>
                            {busy ? "Saving" : "Save"}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}

export default function PlaylistsPage() {
    const router = useRouter();
    const params = useSearchParams();
    const confirm = useConfirm();
    const player = usePlayer();
    const { playlists, loading, error, reload } = usePlaylists();
    const { songs, byId } = useSongs();
    const { byId: artistById } = useArtists();
    const [dialog, setDialog] = useState<"new" | "edit" | null>(null);

    const selectedId = params.get("id");
    const selected = playlists.find((p) => p.id === selectedId) ?? playlists[0];

    const items: PlayItem[] = useMemo(
        () =>
            (selected?.songIds ?? [])
                .map((id) => byId.get(id))
                .filter((s): s is NonNullable<typeof s> => Boolean(s))
                .map((song) => ({ song, artistName: song.artistName ?? (song.artistId ? (artistById.get(song.artistId)?.name ?? "") : "") })),
        [selected, byId, artistById]
    );
    void songs;

    const persist = async (p: PlaylistDTO, songIds: string[], message?: string) => {
        try {
            await axios.put(`/api/playlists/${p.id}`, { name: p.name, description: p.description, songIds });
            invalidate("/api/playlists");
            if (message) showSucces(message);
        } catch (e) {
            showError(handleError(e));
        }
    };

    const move = (p: PlaylistDTO, index: number, delta: number) => {
        const ids = [...p.songIds];
        const to = index + delta;
        if (to < 0 || to >= ids.length) return;
        [ids[index], ids[to]] = [ids[to], ids[index]];
        void persist(p, ids);
    };

    const removePlaylist = async (p: PlaylistDTO) => {
        const ok = await confirm({ title: `Delete ${p.name}?`, message: "The songs themselves are not deleted.", confirmLabel: "Delete" });
        if (!ok) return;
        try {
            await axios.delete(`/api/playlists/${p.id}`);
            invalidate("/api/playlists");
            showSucces("Playlist deleted");
            router.replace(routes.playlists);
        } catch (e) {
            showError(handleError(e));
        }
    };

    const total = items.reduce((n, i) => n + (i.song.durationSec ?? 0), 0);

    return (
        <>
            <PageHeader
                title="Playlists"
                subtitle="Your own playlists. Only you can see them."
                actions={
                    <button type="button" className="btn btn-primary gap-2" onClick={() => setDialog("new")}>
                        <LuPlus aria-hidden /> New playlist
                    </button>
                }
            />
            {loading ? (
                <SkeletonRows rows={4} />
            ) : error ? (
                <ErrorState message={error} onRetry={reload} />
            ) : playlists.length === 0 ? (
                <div className="surface">
                    <EmptyState
                        icon={<LuListMusic size={26} />}
                        title="No playlists yet"
                        message="Create a playlist, then add songs from the Songs page."
                        action={
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => setDialog("new")}>
                                Create a playlist
                            </button>
                        }
                    />
                </div>
            ) : (
                <div className="grid gap-5 lg:grid-cols-3">
                    <nav aria-label="Your playlists" className="surface h-fit p-2 lg:col-span-1">
                        <ul className="flex flex-col">
                            {playlists.map((p) => (
                                <li key={p.id}>
                                    <Link
                                        href={routes.playlist(p.id)}
                                        aria-current={p.id === selected?.id ? "page" : undefined}
                                        className={`hover:bg-base-200 flex items-center gap-3 rounded-xl p-3 ${p.id === selected?.id ? "bg-base-200" : ""}`}
                                    >
                                        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg" aria-hidden>
                                            <LuListMusic />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium">{p.name}</span>
                                            <span className="muted text-xs">
                                                {p.songIds.length} song{p.songIds.length === 1 ? "" : "s"}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {selected && (
                        <section className="surface p-5 lg:col-span-2" aria-label={selected.name}>
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="text-xl font-semibold">{selected.name}</h2>
                                    {selected.description && <p className="muted text-sm">{selected.description}</p>}
                                    <p className="muted mt-1 text-xs">
                                        {items.length} song{items.length === 1 ? "" : "s"}
                                        {items.length > 0 && ` · ${formatTotalDuration(total)}`}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" className="btn btn-primary btn-sm gap-1.5" disabled={items.length === 0} onClick={() => player.play(items, 0)}>
                                        <LuPlay aria-hidden /> Play all
                                    </button>
                                    <button type="button" className="btn btn-outline btn-sm gap-1.5" onClick={() => setDialog("edit")}>
                                        <LuPencil aria-hidden /> Edit
                                    </button>
                                    <button type="button" className="btn btn-ghost btn-sm text-error gap-1.5" onClick={() => void removePlaylist(selected)}>
                                        <LuTrash2 aria-hidden /> Delete
                                    </button>
                                </div>
                            </div>
                            {items.length === 0 ? (
                                <EmptyState
                                    icon={<LuListMusic size={26} />}
                                    title="This playlist is empty"
                                    message="Use Add to playlist on the Songs page."
                                    action={
                                        <Link href={routes.music} className="btn btn-primary btn-sm">
                                            Browse songs
                                        </Link>
                                    }
                                />
                            ) : (
                                <ol className="divide-base-300 divide-y">
                                    {items.map((it, i) => (
                                        <li key={it.song.id} className="flex items-center gap-2 py-2">
                                            <span className="muted w-5 text-right text-xs tabular-nums">{i + 1}</span>
                                            <PlayButton queue={items} index={i} size="xs" />
                                            <CoverArt title={it.song.title} src={it.song.coverUrl} size="xs" />
                                            <span className="min-w-0 flex-1">
                                                <Link href={routes.musicShow(it.song.id)} className="block truncate font-medium hover:underline">
                                                    {it.song.title}
                                                </Link>
                                                <span className="muted block truncate text-xs">{it.artistName}</span>
                                            </span>
                                            <span className="muted hidden text-sm tabular-nums sm:inline">{formatDuration(it.song.durationSec)}</span>
                                            <button type="button" className="btn btn-ghost btn-xs btn-circle" aria-label={`Move ${it.song.title} up`} disabled={i === 0} onClick={() => move(selected, i, -1)}>
                                                <LuArrowUp aria-hidden />
                                            </button>
                                            <button type="button" className="btn btn-ghost btn-xs btn-circle" aria-label={`Move ${it.song.title} down`} disabled={i === items.length - 1} onClick={() => move(selected, i, 1)}>
                                                <LuArrowDown aria-hidden />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs btn-circle text-error"
                                                aria-label={`Remove ${it.song.title} from playlist`}
                                                onClick={() => void persist(selected, selected.songIds.filter((x) => x !== it.song.id), "Removed from playlist")}
                                            >
                                                <LuX aria-hidden />
                                            </button>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>
                    )}
                </div>
            )}
            <PlaylistDialog key={`new-${dialog === "new"}`} open={dialog === "new"} onClose={() => setDialog(null)} />
            {selected && <PlaylistDialog key={`${selected.id}-${selected.updated_at}-${dialog === "edit"}`} open={dialog === "edit"} onClose={() => setDialog(null)} playlist={selected} />}
        </>
    );
}

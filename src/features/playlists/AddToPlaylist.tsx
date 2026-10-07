"use client";
import axios from "axios";
import { useState } from "react";
import { SelectField, TextField } from "@/components/ui/Fields";
import Modal from "@/components/ui/Modal";
import { usePlaylists } from "@/lib/client/hooks";
import { invalidate } from "@/lib/client/use-api";
import type { SongDTO } from "@/lib/domain/types";
import { handleError } from "@/utils/errorsHandle";
import { showError, showSucces } from "@/utils/notify";

const NEW = "__new__";

function Body({ songs, onClose }: { songs: SongDTO[]; onClose: () => void }) {
    const { playlists, loading } = usePlaylists();
    const [choice, setChoice] = useState("");
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();
    const selected = choice || (playlists[0]?.id ?? NEW);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(undefined);
        const ids = songs.map((s) => s.id);
        setBusy(true);
        try {
            if (selected === NEW) {
                if (!name.trim()) {
                    setError("Give the playlist a name");
                    setBusy(false);
                    return;
                }
                await axios.post("/api/playlists", { name: name.trim(), songIds: ids });
            } else {
                const p = playlists.find((x) => x.id === selected);
                if (!p) throw new Error("Playlist not found");
                await axios.put(`/api/playlists/${p.id}`, { name: p.name, description: p.description, songIds: [...new Set([...p.songIds, ...ids])] });
            }
            invalidate("/api/playlists");
            showSucces(`Added ${ids.length} song${ids.length === 1 ? "" : "s"} to the playlist`);
            onClose();
        } catch (err) {
            showError(handleError(err));
            setBusy(false);
        }
    };

    return (
        <form onSubmit={save} noValidate className="flex flex-col gap-4">
            <p className="muted text-sm">
                {songs.length === 1 ? songs[0].title : `${songs.length} songs`}
            </p>
            <SelectField label="Playlist" value={selected} onChange={(e) => setChoice(e.target.value)} disabled={loading}>
                {playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.name} ({p.songIds.length})
                    </option>
                ))}
                <option value={NEW}>New playlist...</option>
            </SelectField>
            {selected === NEW && <TextField label="New playlist name" value={name} onChange={(e) => setName(e.target.value)} error={error} maxLength={80} />}
            <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy || loading}>
                    {busy ? "Saving" : "Add"}
                </button>
            </div>
        </form>
    );
}

export default function AddToPlaylist({ songs, open, onClose }: { songs: SongDTO[]; open: boolean; onClose: () => void }) {
    return (
        <Modal open={open} onClose={onClose} title="Add to playlist" size="sm">
            {open && songs.length > 0 && <Body songs={songs} onClose={onClose} />}
        </Modal>
    );
}

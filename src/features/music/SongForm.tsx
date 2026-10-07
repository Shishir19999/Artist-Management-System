"use client";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SelectField, TextField } from "@/components/ui/Fields";
import ImagePicker from "@/components/ui/ImagePicker";
import { useAuth } from "@/lib/client/auth";
import { useArtists } from "@/lib/client/hooks";
import { routes } from "@/lib/client/routes";
import { invalidate } from "@/lib/client/use-api";
import { GENRES, GENRE_LABEL } from "@/lib/domain/constants";
import { durationInput, parseDuration } from "@/lib/domain/duration";
import type { SongDTO } from "@/lib/domain/types";
import { handleError } from "@/utils/errorsHandle";
import { showError, showSucces } from "@/utils/notify";

interface FormState {
    title: string;
    album: string;
    genre: string;
    artistId: string;
    duration: string;
    releaseDate: string;
    coverUrl: string | null;
}

export function validateSong(f: FormState): Partial<Record<keyof FormState, string>> {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!f.title.trim()) e.title = "Title is required";
    if (!f.artistId) e.artistId = "Choose an artist";
    if (f.duration.trim()) {
        const s = parseDuration(f.duration);
        if (s === null) e.duration = "Use minutes and seconds, for example 3:42";
        else if (s < 1 || s > 7200) e.duration = "Between 0:01 and 2:00:00";
    }
    if (f.releaseDate && (!/^\d{4}-\d{2}-\d{2}$/.test(f.releaseDate) || Number.isNaN(Date.parse(f.releaseDate)))) e.releaseDate = "Enter a valid date";
    return e;
}

export default function SongForm({ song }: { song?: SongDTO }) {
    const router = useRouter();
    const { user } = useAuth();
    const { artists: allArtists, loading } = useArtists();
    // an Artist adds music to their own profile only; the Artist Manager can pick anyone
    const artists = user?.role === "ARTIST" ? allArtists.filter((a) => a.createdBy === user.id) : allArtists;
    const ownId = user?.role === "ARTIST" ? (artists[0]?.id ?? "") : "";
    const editing = Boolean(song);
    const [f, setF] = useState<FormState>({
        title: song?.title ?? "",
        album: song?.album ?? "",
        genre: song?.genre ?? "POP",
        artistId: song?.artistId ?? "",
        duration: durationInput(song?.durationSec),
        releaseDate: song?.releaseDate ? song.releaseDate.slice(0, 10) : "",
        coverUrl: song?.coverUrl ?? null,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [saving, setSaving] = useState(false);

    const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setF((p) => ({ ...p, [key]: e.target.value }));
        setErrors((p) => ({ ...p, [key]: undefined }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const found = validateSong({ ...f, artistId: f.artistId || ownId });
        setErrors(found);
        if (Object.keys(found).length) return;
        setSaving(true);
        const body = {
            title: f.title.trim(),
            album: f.album.trim(),
            genre: f.genre,
            artistId: f.artistId || ownId,
            durationSec: f.duration.trim() ? parseDuration(f.duration) : null,
            releaseDate: f.releaseDate || null,
            coverUrl: f.coverUrl,
        };
        try {
            const res = editing ? await axios.put(`/api/musics/${song!.id}`, body) : await axios.post("/api/musics", body);
            invalidate();
            showSucces(editing ? "Music updated" : "Music added");
            const saved = (res.data.updatedData ?? res.data.data) as SongDTO | undefined;
            router.push(saved?.id ? routes.musicShow(saved.id) : routes.music);
        } catch (err) {
            showError(handleError(err));
            setSaving(false);
        }
    };

    const count = Object.values(errors).filter(Boolean).length;

    return (
        <form onSubmit={submit} noValidate className="surface flex flex-col gap-6 p-5 sm:p-6">
            {count > 0 && (
                <div role="alert" className="alert alert-error alert-soft text-sm">
                    Please fix {count} field{count === 1 ? "" : "s"} below.
                </div>
            )}
            <ImagePicker label="Cover art" shape="cover" name={f.title || "Song"} value={f.coverUrl} onChange={(coverUrl) => setF((p) => ({ ...p, coverUrl }))} />
            <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Title" value={f.title} onChange={set("title")} error={errors.title} required autoComplete="off" />
                <SelectField label="Artist" value={f.artistId || ownId} onChange={set("artistId")} error={errors.artistId} required disabled={loading}>
                    <option value="">{loading ? "Loading artists" : "Select an artist"}</option>
                    {artists.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name}
                        </option>
                    ))}
                </SelectField>
                <TextField label="Album" value={f.album} onChange={set("album")} placeholder="Album or single" />
                <SelectField label="Genre" value={f.genre} onChange={set("genre")}>
                    {GENRES.map((g) => (
                        <option key={g} value={g}>
                            {GENRE_LABEL[g]}
                        </option>
                    ))}
                </SelectField>
                <TextField label="Duration" value={f.duration} onChange={set("duration")} error={errors.duration} placeholder="3:42" inputMode="numeric" hint="Minutes and seconds" />
                <TextField label="Release date" type="date" value={f.releaseDate} onChange={set("releaseDate")} error={errors.releaseDate} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
                <Link href={editing ? routes.musicShow(song!.id) : routes.music} className="btn btn-ghost">
                    Cancel
                </Link>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving" : editing ? "Save changes" : "Add music"}
                </button>
            </div>
        </form>
    );
}

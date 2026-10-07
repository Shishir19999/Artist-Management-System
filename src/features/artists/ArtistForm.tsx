"use client";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Fields";
import ImagePicker from "@/components/ui/ImagePicker";
import { routes } from "@/lib/client/routes";
import { invalidate } from "@/lib/client/use-api";
import { GENDERS } from "@/lib/domain/constants";
import type { ArtistDTO } from "@/lib/domain/types";
import { handleError } from "@/utils/errorsHandle";
import { showError, showSucces } from "@/utils/notify";

interface FormState {
    name: string;
    email: string;
    gender: string;
    first_release_year: string;
    total_albums: string;
    address: string;
    bio: string;
    website: string;
    instagram: string;
    youtube: string;
    spotify: string;
    photo: string | null;
}

function initial(a?: ArtistDTO): FormState {
    return {
        name: a?.name ?? "",
        email: a?.email ?? "",
        gender: a?.gender ?? "MALE",
        first_release_year: a?.first_release_year ?? "",
        total_albums: String(a?.total_albums ?? 0),
        address: a?.address ?? "",
        bio: a?.bio ?? "",
        website: a?.website ?? "",
        instagram: a?.instagram ?? "",
        youtube: a?.youtube ?? "",
        spotify: a?.spotify ?? "",
        photo: a?.photo ?? null,
    };
}

export function validateArtist(f: FormState): Partial<Record<keyof FormState, string>> {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!f.name.trim()) e.name = "Name is required";
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Enter a valid email address";
    if (f.first_release_year.trim() && !/^\d{4}$/.test(f.first_release_year.trim())) e.first_release_year = "Use a four-digit year, for example 2019";
    const albums = Number(f.total_albums);
    if (f.total_albums.trim() === "" || !Number.isInteger(albums) || albums < 0) e.total_albums = "Enter a whole number, 0 or more";
    for (const k of ["website", "youtube", "spotify"] as const) {
        if (f[k].trim() && !/^https?:\/\/\S+$/i.test(f[k].trim())) e[k] = "Start the link with http:// or https://";
    }
    if (f.instagram.trim() && !/^@?[A-Za-z0-9._]{1,30}$/.test(f.instagram.trim())) e.instagram = "Enter a handle such as @artist";
    return e;
}

export default function ArtistForm({ artist }: { artist?: ArtistDTO }) {
    const router = useRouter();
    const [f, setF] = useState<FormState>(() => initial(artist));
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [saving, setSaving] = useState(false);
    const editing = Boolean(artist);

    const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setF((prev) => ({ ...prev, [key]: e.target.value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const found = validateArtist(f);
        setErrors(found);
        if (Object.keys(found).length) {
            document.getElementById("main")?.scrollIntoView({ behavior: "smooth" });
            return;
        }
        setSaving(true);
        const body = {
            name: f.name.trim(),
            email: f.email.trim() || undefined,
            gender: f.gender,
            first_release_year: f.first_release_year.trim(),
            total_albums: Number(f.total_albums),
            address: f.address.trim(),
            bio: f.bio.trim() || null,
            website: f.website.trim() || null,
            instagram: f.instagram.trim().replace(/^@?/, "") ? `@${f.instagram.trim().replace(/^@/, "")}` : null,
            youtube: f.youtube.trim() || null,
            spotify: f.spotify.trim() || null,
            photo: f.photo,
        };
        try {
            const res = editing ? await axios.put(`/api/artists/${artist!.id}`, body) : await axios.post("/api/artists", body);
            invalidate();
            showSucces(editing ? "Artist updated" : "Artist created");
            const saved = (res.data.updatedData ?? res.data.newArtist) as ArtistDTO | undefined;
            router.push(saved?.id ? routes.artistShow(saved.id) : routes.artists);
        } catch (err) {
            showError(handleError(err));
            setSaving(false);
        }
    };

    const errorList = Object.values(errors).filter(Boolean);

    return (
        <form onSubmit={submit} noValidate className="surface flex flex-col gap-6 p-5 sm:p-6">
            {errorList.length > 0 && (
                <div role="alert" className="alert alert-error alert-soft text-sm">
                    Please fix {errorList.length} field{errorList.length === 1 ? "" : "s"} below.
                </div>
            )}
            <ImagePicker label="Photo" name={f.name} value={f.photo} onChange={(photo) => setF((p) => ({ ...p, photo }))} />

            <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-base font-semibold">Details</legend>
                <TextField label="Name" value={f.name} onChange={set("name")} error={errors.name} required autoComplete="off" />
                <TextField label="Email" type="email" value={f.email} onChange={set("email")} error={errors.email} placeholder="artist@example.com" />
                <SelectField label="Gender" value={f.gender} onChange={set("gender")}>
                    {GENDERS.map((g) => (
                        <option key={g} value={g}>
                            {g.charAt(0) + g.slice(1).toLowerCase()}
                        </option>
                    ))}
                </SelectField>
                <TextField label="Location" value={f.address} onChange={set("address")} placeholder="City, country" />
                <TextField
                    label="First release year"
                    inputMode="numeric"
                    maxLength={4}
                    value={f.first_release_year}
                    onChange={set("first_release_year")}
                    error={errors.first_release_year}
                    placeholder="2019"
                />
                <TextField label="Total albums" type="number" min={0} step={1} value={f.total_albums} onChange={set("total_albums")} error={errors.total_albums} />
                <div className="sm:col-span-2">
                    <TextAreaField label="Biography" value={f.bio} onChange={set("bio")} maxLength={2000} hint={`${f.bio.length} / 2000 characters`} />
                </div>
            </fieldset>

            <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-base font-semibold">Links</legend>
                <TextField label="Website" type="url" value={f.website} onChange={set("website")} error={errors.website} placeholder="https://example.com" />
                <TextField label="Instagram" value={f.instagram} onChange={set("instagram")} error={errors.instagram} placeholder="@artist" />
                <TextField label="YouTube" type="url" value={f.youtube} onChange={set("youtube")} error={errors.youtube} placeholder="https://youtube.com/@artist" />
                <TextField label="Spotify" type="url" value={f.spotify} onChange={set("spotify")} error={errors.spotify} placeholder="https://open.spotify.com/artist/..." />
            </fieldset>

            <div className="flex flex-wrap justify-end gap-2">
                <Link href={editing ? routes.artistShow(artist!.id) : routes.artists} className="btn btn-ghost">
                    Cancel
                </Link>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                        <>
                            <span className="loading loading-spinner loading-sm" aria-hidden /> Saving
                        </>
                    ) : editing ? (
                        "Save changes"
                    ) : (
                        "Create artist"
                    )}
                </button>
            </div>
        </form>
    );
}

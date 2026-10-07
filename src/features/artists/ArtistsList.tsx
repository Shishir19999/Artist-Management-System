"use client";
import axios from "axios";
import Link from "next/link";
import { useMemo, useState } from "react";
import { LuEye, LuPencil, LuPlus, LuTrash2, LuUpload } from "react-icons/lu";
import FavoriteButton from "@/components/Favorite";
import { Avatar } from "@/components/ui/Art";
import { useConfirm } from "@/components/ui/Confirm";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ImportDialog from "@/components/ui/ImportDialog";
import { PageHeader } from "@/components/ui/States";
import { useAuth } from "@/lib/client/auth";
import { formatDate } from "@/lib/client/format";
import { useArtists, useSongs } from "@/lib/client/hooks";
import { routes } from "@/lib/client/routes";
import { invalidate } from "@/lib/client/use-api";
import { GENDERS } from "@/lib/domain/constants";
import type { ArtistDTO } from "@/lib/domain/types";
import { showError, showSucces } from "@/utils/notify";

const IMPORT_COLUMNS = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "gender", label: "Gender" },
    { key: "first_release_year", label: "First release year" },
    { key: "total_albums", label: "Total albums" },
    { key: "address", label: "Location" },
    { key: "bio", label: "Bio" },
];

export default function ArtistsList() {
    const { user } = useAuth();
    const canManage = user?.role !== "USER";
    const { artists, loading, error, reload } = useArtists();
    const { songs } = useSongs();
    const confirm = useConfirm();
    const [importOpen, setImportOpen] = useState(false);

    const songCount = useMemo(() => {
        const m = new Map<string, number>();
        for (const s of songs) if (s.artistId) m.set(s.artistId, (m.get(s.artistId) ?? 0) + 1);
        return m;
    }, [songs]);

    const remove = async (list: ArtistDTO[], clear?: () => void) => {
        const ok = await confirm({
            title: list.length === 1 ? `Delete ${list[0].name}?` : `Delete ${list.length} artists?`,
            message: "Their songs stay in the catalogue but lose the artist link, and their gigs are removed. This cannot be undone.",
            confirmLabel: "Delete",
        });
        if (!ok) return;
        const results = await Promise.allSettled(list.map((a) => axios.delete(`/api/artists/${a.id}`)));
        const failed = results.filter((r) => r.status === "rejected");
        invalidate();
        clear?.();
        if (failed.length) showError(`${failed.length} of ${list.length} could not be deleted`);
        else showSucces(list.length === 1 ? "Artist deleted" : `${list.length} artists deleted`);
    };

    const columns: Column<ArtistDTO>[] = [
        {
            key: "name",
            header: "Artist",
            accessor: (a) => a.name,
            cell: (a) => (
                <Link href={routes.artistShow(a.id)} className="flex min-w-44 items-center gap-3 font-medium hover:underline">
                    <Avatar name={a.name} src={a.photo} size="sm" />
                    {a.name}
                </Link>
            ),
        },
        { key: "email", header: "Email", accessor: (a) => a.email },
        { key: "gender", header: "Gender", accessor: (a) => a.gender, cell: (a) => <span className="badge badge-ghost">{a.gender.toLowerCase()}</span> },
        { key: "address", header: "Location", accessor: (a) => a.address },
        { key: "first_release_year", header: "First release", accessor: (a) => a.first_release_year, numeric: true },
        { key: "total_albums", header: "Albums", accessor: (a) => a.total_albums, numeric: true },
        { key: "songs", header: "Songs", accessor: (a) => songCount.get(a.id) ?? 0, numeric: true },
        { key: "created_at", header: "Added", accessor: (a) => a.created_at, cell: (a) => formatDate(a.created_at), hiddenByDefault: true },
    ];

    return (
        <>
            <PageHeader
                title="Artists"
                subtitle={canManage ? "Everyone on the roster." : "Artists shared with you."}
                actions={
                    canManage && (
                        <>
                            <button type="button" className="btn btn-outline gap-2" onClick={() => setImportOpen(true)}>
                                <LuUpload aria-hidden /> Import CSV
                            </button>
                            <Link href={routes.artistNew} className="btn btn-primary gap-2">
                                <LuPlus aria-hidden /> New artist
                            </Link>
                        </>
                    )
                }
            />
            <DataTable
                caption="Artists"
                rows={artists}
                columns={columns}
                getId={(a) => a.id}
                loading={loading}
                error={error}
                onRetry={reload}
                emptyTitle="No artists yet"
                emptyMessage={canManage ? "Create the first artist or import a CSV file." : "Nothing has been shared with you yet."}
                emptyAction={
                    canManage && (
                        <Link href={routes.artistNew} className="btn btn-primary btn-sm">
                            Create an artist
                        </Link>
                    )
                }
                filters={[
                    {
                        key: "gender",
                        label: "Gender",
                        options: GENDERS.map((g) => ({ value: g, label: g.charAt(0) + g.slice(1).toLowerCase() })),
                        match: (a, v) => a.gender === v,
                    },
                ]}
                selectable={canManage}
                bulkActions={(sel, clear) => (
                    <button type="button" className="btn btn-error btn-sm gap-1.5" onClick={() => void remove(sel, clear)}>
                        <LuTrash2 aria-hidden /> Delete selected
                    </button>
                )}
                csvName="artists"
                storageKey="artists"
                initialSort={{ key: "name", dir: "asc" }}
                rowActions={(a) => (
                    <span className="inline-flex items-center gap-0.5">
                        <FavoriteButton type="ARTIST" id={a.id} name={a.name} size="xs" />
                        <Link href={routes.artistShow(a.id)} className="btn btn-ghost btn-xs btn-circle" aria-label={`View ${a.name}`}>
                            <LuEye aria-hidden />
                        </Link>
                        {canManage && (
                            <>
                                <Link href={routes.artistEdit(a.id)} className="btn btn-ghost btn-xs btn-circle" aria-label={`Edit ${a.name}`}>
                                    <LuPencil aria-hidden />
                                </Link>
                                <button type="button" className="btn btn-ghost btn-xs btn-circle text-error" aria-label={`Delete ${a.name}`} onClick={() => void remove([a])}>
                                    <LuTrash2 aria-hidden />
                                </button>
                            </>
                        )}
                    </span>
                )}
            />

            {canManage && (
                <ImportDialog
                    open={importOpen}
                    onClose={() => setImportOpen(false)}
                    title="Import artists from CSV"
                    hint="Required column: Name. Gender must be MALE, FEMALE or OTHER (default MALE). Rows are created one by one, so invalid rows are skipped and reported."
                    columns={IMPORT_COLUMNS}
                    example={{ name: "Example Artist", email: "artist@example.com", gender: "FEMALE", first_release_year: "2018", total_albums: "2", address: "Lisbon", bio: "Short biography" }}
                    templateName="artists"
                    mapRow={(r) => {
                        if (!r.name?.trim()) return { error: "Name is required" };
                        const gender = (r.gender || "MALE").toUpperCase();
                        if (!(GENDERS as readonly string[]).includes(gender)) return { error: `Unknown gender "${r.gender}"` };
                        const albums = r.total_albums ? Number(r.total_albums) : 0;
                        if (!Number.isInteger(albums) || albums < 0) return { error: "Total albums must be a whole number" };
                        return {
                            payload: {
                                name: r.name.trim(),
                                email: r.email?.trim() || undefined,
                                gender,
                                first_release_year: r.first_release_year?.trim() ?? "",
                                total_albums: albums,
                                address: r.address?.trim() ?? "",
                                bio: r.bio?.trim() || undefined,
                            },
                        };
                    }}
                    send={(payload) => axios.post("/api/artists", payload)}
                    onDone={() => invalidate()}
                />
            )}
        </>
    );
}

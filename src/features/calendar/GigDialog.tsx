"use client";
import axios from "axios";
import { useState } from "react";
import { useConfirm } from "@/components/ui/Confirm";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Fields";
import Modal from "@/components/ui/Modal";
import { invalidate } from "@/lib/client/use-api";
import { GIG_STATUSES } from "@/lib/domain/constants";
import type { ArtistDTO, GigDTO } from "@/lib/domain/types";
import { handleError } from "@/utils/errorsHandle";
import { showError, showSucces } from "@/utils/notify";

export const STATUS_LABEL: Record<string, string> = {
    HOLD: "On hold",
    CONFIRMED: "Confirmed",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
};

export const STATUS_BADGE: Record<string, string> = {
    HOLD: "badge-warning",
    CONFIRMED: "badge-success",
    COMPLETED: "badge-info",
    CANCELLED: "badge-error",
};

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO instant -> value for <input type="datetime-local"> in the visitor's time zone. */
export function toLocalInput(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface FormState {
    artistId: string;
    title: string;
    venue: string;
    city: string;
    date: string;
    status: string;
    fee: string;
    notes: string;
}

function Body({
    gig,
    artists,
    defaultArtistId,
    defaultDate,
    onClose,
}: {
    gig?: GigDTO;
    artists: ArtistDTO[];
    defaultArtistId?: string;
    defaultDate?: string;
    onClose: () => void;
}) {
    const confirm = useConfirm();
    const [f, setF] = useState<FormState>({
        artistId: gig?.artistId ?? defaultArtistId ?? artists[0]?.id ?? "",
        title: gig?.title ?? "",
        venue: gig?.venue ?? "",
        city: gig?.city ?? "",
        date: gig ? toLocalInput(gig.date) : `${defaultDate ?? new Date().toISOString().slice(0, 10)}T20:00`,
        status: gig?.status ?? "CONFIRMED",
        fee: gig?.fee != null ? String(gig.fee) : "",
        notes: gig?.notes ?? "",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [saving, setSaving] = useState(false);

    const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setF((p) => ({ ...p, [k]: e.target.value }));
        setErrors((p) => ({ ...p, [k]: undefined }));
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        const found: Partial<Record<keyof FormState, string>> = {};
        if (!f.artistId) found.artistId = "Choose an artist";
        if (!f.title.trim()) found.title = "Title is required";
        if (!f.venue.trim()) found.venue = "Venue is required";
        if (!f.date || Number.isNaN(new Date(f.date).getTime())) found.date = "Pick a date and time";
        if (f.fee.trim() && (!Number.isInteger(Number(f.fee)) || Number(f.fee) < 0)) found.fee = "Whole number, 0 or more";
        setErrors(found);
        if (Object.keys(found).length) return;

        setSaving(true);
        const body = {
            artistId: f.artistId,
            title: f.title.trim(),
            venue: f.venue.trim(),
            city: f.city.trim() || null,
            date: new Date(f.date).toISOString(),
            status: f.status,
            fee: f.fee.trim() ? Number(f.fee) : null,
            notes: f.notes.trim() || null,
        };
        try {
            if (gig) await axios.put(`/api/gigs/${gig.id}`, body);
            else await axios.post("/api/gigs", body);
            invalidate();
            showSucces(gig ? "Gig updated" : "Gig added");
            onClose();
        } catch (err) {
            showError(handleError(err));
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!gig) return;
        const ok = await confirm({ title: "Delete this gig?", message: `${gig.title} will be removed from the calendar.` });
        if (!ok) return;
        try {
            await axios.delete(`/api/gigs/${gig.id}`);
            invalidate();
            showSucces("Gig deleted");
            onClose();
        } catch (err) {
            showError(handleError(err));
        }
    };

    return (
        <form id="gig-form" onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
                <SelectField label="Artist" value={f.artistId} onChange={set("artistId")} error={errors.artistId} required>
                    {artists.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name}
                        </option>
                    ))}
                </SelectField>
            </div>
            <div className="sm:col-span-2">
                <TextField label="Title" value={f.title} onChange={set("title")} error={errors.title} required placeholder="Summer festival main stage" />
            </div>
            <TextField label="Venue" value={f.venue} onChange={set("venue")} error={errors.venue} required />
            <TextField label="City" value={f.city} onChange={set("city")} />
            <TextField label="Date and time" type="datetime-local" value={f.date} onChange={set("date")} error={errors.date} required />
            <SelectField label="Status" value={f.status} onChange={set("status")}>
                {GIG_STATUSES.map((s) => (
                    <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                    </option>
                ))}
            </SelectField>
            <TextField label="Fee (USD)" type="number" min={0} step={1} value={f.fee} onChange={set("fee")} error={errors.fee} />
            <div className="sm:col-span-2">
                <TextAreaField label="Notes" value={f.notes} onChange={set("notes")} maxLength={500} className="min-h-20" />
            </div>
            <div className="flex flex-wrap justify-between gap-2 sm:col-span-2">
                {gig ? (
                    <button type="button" className="btn btn-ghost text-error" onClick={() => void remove()}>
                        Delete gig
                    </button>
                ) : (
                    <span />
                )}
                <span className="flex gap-2">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? "Saving" : gig ? "Save gig" : "Add gig"}
                    </button>
                </span>
            </div>
        </form>
    );
}

export default function GigDialog({
    open,
    onClose,
    gig,
    artists,
    defaultArtistId,
    defaultDate,
}: {
    open: boolean;
    onClose: () => void;
    gig?: GigDTO;
    artists: ArtistDTO[];
    defaultArtistId?: string;
    defaultDate?: string;
}) {
    return (
        <Modal open={open} onClose={onClose} title={gig ? "Edit gig" : "Add a gig"}>
            {open && (
                <Body
                    key={gig?.id ?? `new-${defaultDate}-${defaultArtistId}`}
                    gig={gig}
                    artists={artists}
                    defaultArtistId={defaultArtistId}
                    defaultDate={defaultDate}
                    onClose={onClose}
                />
            )}
        </Modal>
    );
}

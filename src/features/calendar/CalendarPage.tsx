"use client";
import { useMemo, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuPlus } from "react-icons/lu";
import { ErrorState, PageHeader, SkeletonRows } from "@/components/ui/States";
import { useAuth } from "@/lib/client/auth";
import { formatDateTime, formatMoney } from "@/lib/client/format";
import { useArtists, useGigs } from "@/lib/client/hooks";
import { monthGrid, dayKey } from "@/lib/domain/calendar";
import type { GigDTO } from "@/lib/domain/types";
import GigDialog, { STATUS_BADGE, STATUS_LABEL } from "./GigDialog";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DOT: Record<string, string> = { HOLD: "bg-warning", CONFIRMED: "bg-success", COMPLETED: "bg-info", CANCELLED: "bg-error" };

export default function CalendarPage() {
    const { user } = useAuth();
    const canManage = user?.role !== "USER";
    const { gigs, loading, error, reload } = useGigs();
    const { artists, byId } = useArtists();
    const today = new Date();
    const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
    const [selected, setSelected] = useState<string>(dayKey(today));
    const [dialog, setDialog] = useState<{ gig?: GigDTO; date?: string } | null>(null);

    const cells = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
    const byDay = useMemo(() => {
        const map = new Map<string, GigDTO[]>();
        for (const g of gigs) {
            const k = dayKey(new Date(g.date));
            map.set(k, [...(map.get(k) ?? []), g]);
        }
        return map;
    }, [gigs]);

    const shift = (delta: number) => setCursor((c) => {
        const d = new Date(c.y, c.m + delta, 1);
        return { y: d.getFullYear(), m: d.getMonth() };
    });
    const title = new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const dayGigs = byDay.get(selected) ?? [];
    const defaultDate = `${selected}T19:00`;

    return (
        <>
            <PageHeader
                title="Calendar"
                subtitle={canManage ? "Gigs and bookings across the roster." : "Gigs of the artists shared with you."}
                actions={
                    canManage && (
                        <button type="button" className="btn btn-primary gap-2" onClick={() => setDialog({ date: defaultDate })} disabled={artists.length === 0}>
                            <LuPlus aria-hidden /> Add gig
                        </button>
                    )
                }
            />
            {loading ? (
                <SkeletonRows rows={6} />
            ) : error ? (
                <ErrorState message={error} onRetry={reload} />
            ) : (
                <div className="grid gap-5 lg:grid-cols-3">
                    <section className="surface p-4 lg:col-span-2" aria-label={`Calendar for ${title}`}>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold" aria-live="polite">
                                {title}
                            </h2>
                            <div className="flex gap-1">
                                <button type="button" className="btn btn-ghost btn-sm btn-circle" aria-label="Previous month" onClick={() => shift(-1)}>
                                    <LuChevronLeft aria-hidden />
                                </button>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCursor({ y: today.getFullYear(), m: today.getMonth() }); setSelected(dayKey(today)); }}>
                                    Today
                                </button>
                                <button type="button" className="btn btn-ghost btn-sm btn-circle" aria-label="Next month" onClick={() => shift(1)}>
                                    <LuChevronRight aria-hidden />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium" aria-hidden>
                            {WEEKDAYS.map((d) => (
                                <div key={d} className="muted py-1">
                                    {d}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1" role="grid" aria-label={title}>
                            {cells.map((c) => {
                                const list = byDay.get(c.key) ?? [];
                                const isSel = c.key === selected;
                                return (
                                    <button
                                        key={c.key}
                                        type="button"
                                        role="gridcell"
                                        aria-selected={isSel}
                                        aria-label={`${c.date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}, ${list.length} gig${list.length === 1 ? "" : "s"}`}
                                        onClick={() => setSelected(c.key)}
                                        className={`flex min-h-14 flex-col items-center gap-1 rounded-lg border p-1 text-sm transition-colors sm:min-h-20 ${
                                            isSel ? "border-primary bg-primary/10" : "border-transparent hover:bg-base-200"
                                        } ${c.inMonth ? "" : "opacity-50"} ${c.key === dayKey(today) ? "font-bold" : ""}`}
                                    >
                                        <span className={c.key === dayKey(today) ? "bg-primary text-primary-content flex size-6 items-center justify-center rounded-full" : "flex size-6 items-center justify-center"}>
                                            {c.date.getDate()}
                                        </span>
                                        <span className="flex flex-wrap justify-center gap-0.5" aria-hidden>
                                            {list.slice(0, 4).map((g) => (
                                                <span key={g.id} className={`size-1.5 rounded-full ${DOT[g.status]}`} />
                                            ))}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <ul className="muted mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legend">
                            {Object.keys(DOT).map((s) => (
                                <li key={s} className="flex items-center gap-1.5">
                                    <span className={`size-2 rounded-full ${DOT[s]}`} aria-hidden /> {STATUS_LABEL[s]}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="surface p-4" aria-label="Selected day">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <h2 className="text-base font-semibold">{new Date(`${selected}T12:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h2>
                            {canManage && artists.length > 0 && (
                                <button type="button" className="btn btn-outline btn-xs gap-1" onClick={() => setDialog({ date: defaultDate })}>
                                    <LuPlus aria-hidden /> Add
                                </button>
                            )}
                        </div>
                        {dayGigs.length === 0 ? (
                            <p className="muted text-sm">No gigs on this day.</p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {dayGigs.map((g) => (
                                    <li key={g.id} className="border-base-300 rounded-xl border p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-medium">{g.title}</p>
                                                <p className="muted text-xs">{byId.get(g.artistId)?.name ?? "Unknown artist"}</p>
                                            </div>
                                            <span className={`badge ${STATUS_BADGE[g.status]}`}>{STATUS_LABEL[g.status]}</span>
                                        </div>
                                        <p className="muted mt-1 text-xs">
                                            {formatDateTime(g.date)} · {g.venue}
                                            {g.city ? `, ${g.city}` : ""}
                                            {g.fee != null ? ` · ${formatMoney(g.fee)}` : ""}
                                        </p>
                                        {canManage && (
                                            <button type="button" className="btn btn-ghost btn-xs mt-1" onClick={() => setDialog({ gig: g })}>
                                                Edit gig
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            )}
            {canManage && <GigDialog open={dialog !== null} onClose={() => setDialog(null)} gig={dialog?.gig} artists={artists} defaultDate={dialog?.date} />}
        </>
    );
}

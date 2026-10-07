"use client";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LuListMusic, LuMic, LuMusic, LuSearch } from "react-icons/lu";
import Modal from "@/components/ui/Modal";
import { useArtists, usePlaylists, useSongs } from "@/lib/client/hooks";
import { routes } from "@/lib/client/routes";
import { GENRE_LABEL } from "@/lib/domain/constants";

interface Hit {
    key: string;
    label: string;
    sub: string;
    href: string;
    kind: "Artist" | "Song" | "Playlist";
}

const ICON = { Artist: LuMic, Song: LuMusic, Playlist: LuListMusic } as const;

function SearchBody({ onDone }: { onDone: () => void }) {
    const router = useRouter();
    const listId = useId();
    const [q, setQ] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const { artists, byId } = useArtists();
    const { songs } = useSongs();
    const { playlists } = usePlaylists();

    useEffect(() => inputRef.current?.focus(), []);

    const hits = useMemo<Hit[]>(() => {
        const term = q.trim().toLowerCase();
        if (!term) return [];
        const out: Hit[] = [];
        for (const a of artists) {
            if (`${a.name} ${a.email ?? ""} ${a.address ?? ""}`.toLowerCase().includes(term))
                out.push({ key: `a${a.id}`, label: a.name, sub: a.address ?? "Artist", href: routes.artistShow(a.id), kind: "Artist" });
        }
        for (const s of songs) {
            if (`${s.title} ${s.album ?? ""} ${GENRE_LABEL[s.genre]}`.toLowerCase().includes(term))
                out.push({
                    key: `s${s.id}`,
                    label: s.title,
                    sub: `${byId.get(s.artistId ?? "")?.name ?? "Unknown artist"} - ${GENRE_LABEL[s.genre]}`,
                    href: routes.musicShow(s.id),
                    kind: "Song",
                });
        }
        for (const p of playlists) {
            if (p.name.toLowerCase().includes(term))
                out.push({ key: `p${p.id}`, label: p.name, sub: `${p.songIds.length} songs`, href: routes.playlist(p.id), kind: "Playlist" });
        }
        return out.slice(0, 30);
    }, [q, artists, songs, playlists, byId]);

    const go = (h: Hit) => {
        onDone();
        router.push(h.href);
    };

    return (
        <div>
            <label className="input w-full items-center gap-2">
                <LuSearch aria-hidden className="opacity-60" />
                <span className="sr-only">Search artists, songs and playlists</span>
                <input
                    ref={inputRef}
                    data-autofocus
                    role="combobox"
                    aria-expanded={hits.length > 0}
                    aria-controls={listId}
                    aria-activedescendant={hits[active] ? `${listId}-${active}` : undefined}
                    aria-autocomplete="list"
                    type="search"
                    value={q}
                    placeholder="Search artists, songs, playlists"
                    className="grow"
                    onChange={(e) => {
                        setQ(e.target.value);
                        setActive(0);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setActive((i) => Math.min(hits.length - 1, i + 1));
                        } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setActive((i) => Math.max(0, i - 1));
                        } else if (e.key === "Enter" && hits[active]) {
                            e.preventDefault();
                            go(hits[active]);
                        }
                    }}
                />
            </label>
            <ul id={listId} role="listbox" aria-label="Search results" className="mt-3 flex max-h-80 flex-col gap-1 overflow-y-auto">
                {hits.map((h, i) => {
                    const Icon = ICON[h.kind];
                    return (
                        <li
                            key={h.key}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === active}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${i === active ? "bg-primary/15" : "hover:bg-base-200"}`}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => go(h)}
                        >
                            <Icon aria-hidden className="text-primary shrink-0" />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{h.label}</span>
                                <span className="muted block truncate text-xs">{h.sub}</span>
                            </span>
                            <span className="badge badge-ghost badge-sm">{h.kind}</span>
                        </li>
                    );
                })}
            </ul>
            {q.trim() && hits.length === 0 && <p className="muted py-6 text-center text-sm">No results for &ldquo;{q.trim()}&rdquo;.</p>}
            {!q.trim() && <p className="muted py-6 text-center text-sm">Type to search. Use the arrow keys and Enter to open a result.</p>}
        </div>
    );
}

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <Modal open={open} onClose={onClose} title="Search">
            {open && <SearchBody onDone={onClose} />}
        </Modal>
    );
}

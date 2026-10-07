"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LuPause, LuPlay, LuSkipBack, LuSkipForward, LuX } from "react-icons/lu";
import { CoverArt } from "@/components/ui/Art";
import { buildMelody } from "@/lib/audio/melody";
import { formatDuration } from "@/lib/client/format";
import { GENRE_LABEL } from "@/lib/domain/constants";
import type { SongDTO } from "@/lib/domain/types";

export interface PlayItem {
    song: SongDTO;
    artistName: string;
}

interface PlayerApi {
    current: PlayItem | null;
    playing: boolean;
    play: (queue: PlayItem[], index: number) => void;
    toggle: (item?: PlayItem) => void;
    stop: () => void;
}

const PlayerContext = createContext<PlayerApi | null>(null);
const PREVIEW_SECONDS = 16;

type AudioCtor = typeof AudioContext;

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [queue, setQueue] = useState<PlayItem[]>([]);
    const [index, setIndex] = useState(-1);
    const [playing, setPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const ctxRef = useRef<AudioContext | null>(null);
    const startRef = useRef(0);
    const rafRef = useRef(0);
    const queueRef = useRef<PlayItem[]>([]);
    const advanceRef = useRef<() => void>(() => {});

    const teardown = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        const ctx = ctxRef.current;
        ctxRef.current = null;
        if (ctx && ctx.state !== "closed") void ctx.close().catch(() => {});
    }, []);

    const start = useCallback(
        (list: PlayItem[], i: number) => {
            const item = list[i];
            if (!item) return;
            teardown();
            const Ctor: AudioCtor | undefined =
                window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
            queueRef.current = list;
            setQueue(list);
            setIndex(i);
            setPosition(0);
            if (!Ctor) {
                setPlaying(false);
                return;
            }
            const ctx = new Ctor();
            ctxRef.current = ctx;
            const master = ctx.createGain();
            master.gain.value = 0.5;
            master.connect(ctx.destination);
            const length = Math.min(PREVIEW_SECONDS, item.song.durationSec ?? PREVIEW_SECONDS);
            const melody = buildMelody(item.song.id, item.song.genre, length);
            const t0 = ctx.currentTime + 0.06;
            startRef.current = t0;
            for (const n of melody.notes) {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = n.wave;
                osc.frequency.value = n.freq;
                const a = t0 + n.t;
                g.gain.setValueAtTime(0.0001, a);
                g.gain.exponentialRampToValueAtTime(n.gain, a + 0.02);
                g.gain.exponentialRampToValueAtTime(0.0001, a + Math.max(n.dur, 0.08));
                osc.connect(g).connect(master);
                osc.start(a);
                osc.stop(a + Math.max(n.dur, 0.08) + 0.05);
            }
            if (ctx.state === "suspended") void ctx.resume();
            setPlaying(true);
            const tick = () => {
                const c = ctxRef.current;
                if (!c) return;
                const pos = Math.max(0, c.currentTime - startRef.current);
                if (pos >= melody.length) {
                    advanceRef.current();
                    return;
                }
                setPosition(pos);
                rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
        },
        [teardown]
    );

    const stop = useCallback(() => {
        teardown();
        setPlaying(false);
        setPosition(0);
        setQueue([]);
        setIndex(-1);
    }, [teardown]);

    useEffect(() => {
        advanceRef.current = () => {
            const q = queueRef.current;
            if (index + 1 < q.length) start(q, index + 1);
            else {
                teardown();
                setPlaying(false);
                setPosition(0);
            }
        };
    }, [index, start, teardown]);

    useEffect(() => () => teardown(), [teardown]);

    const current = index >= 0 ? (queue[index] ?? null) : null;

    const pauseResume = useCallback(() => {
        const ctx = ctxRef.current;
        if (!ctx) {
            if (current) start(queueRef.current, index);
            return;
        }
        if (ctx.state === "running") {
            void ctx.suspend();
            setPlaying(false);
        } else {
            void ctx.resume();
            setPlaying(true);
        }
    }, [current, index, start]);

    const api = useMemo<PlayerApi>(
        () => ({
            current,
            playing,
            play: start,
            stop,
            toggle: (item) => {
                if (item && item.song.id !== current?.song.id) start([item], 0);
                else pauseResume();
            },
        }),
        [current, playing, start, stop, pauseResume]
    );

    const length = current ? Math.min(PREVIEW_SECONDS, current.song.durationSec ?? PREVIEW_SECONDS) : PREVIEW_SECONDS;

    return (
        <PlayerContext.Provider value={api}>
            {children}
            {current && (
                <section
                    aria-label="Audio preview player"
                    className="bg-base-100 border-base-300 fixed inset-x-0 bottom-0 z-40 border-t shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
                >
                    <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2 sm:gap-4 sm:px-4">
                        <CoverArt title={current.song.title} src={current.song.coverUrl} size="sm" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold" data-testid="player-title">
                                {current.song.title}
                            </p>
                            <p className="muted truncate text-xs">
                                {current.artistName} - {GENRE_LABEL[current.song.genre]} - 16 s preview
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                                <progress
                                    className="progress progress-primary h-1.5 flex-1"
                                    value={position}
                                    max={length}
                                    aria-label="Preview progress"
                                />
                                <span className="muted w-14 text-right text-[11px] tabular-nums">
                                    {formatDuration(Math.floor(position))} / {formatDuration(Math.floor(length))}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm btn-circle"
                                aria-label="Previous track"
                                disabled={index <= 0}
                                onClick={() => start(queue, index - 1)}
                            >
                                <LuSkipBack aria-hidden />
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary btn-circle"
                                aria-label={playing ? "Pause" : "Play"}
                                onClick={pauseResume}
                            >
                                {playing ? <LuPause aria-hidden /> : <LuPlay aria-hidden />}
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm btn-circle"
                                aria-label="Next track"
                                disabled={index >= queue.length - 1}
                                onClick={() => start(queue, index + 1)}
                            >
                                <LuSkipForward aria-hidden />
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm btn-circle" aria-label="Close player" onClick={stop}>
                                <LuX aria-hidden />
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </PlayerContext.Provider>
    );
}

export function usePlayer(): PlayerApi {
    const ctx = useContext(PlayerContext);
    if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
    return ctx;
}

/** Round play/pause button for one song; plays the supplied queue starting at `index`. */
export function PlayButton({ queue, index, size = "sm" }: { queue: PlayItem[]; index: number; size?: "xs" | "sm" | "md" }) {
    const player = usePlayer();
    const item = queue[index];
    const active = player.current?.song.id === item?.song.id;
    const isPlaying = active && player.playing;
    return (
        <button
            type="button"
            className={`btn btn-circle btn-${size} ${active ? "btn-primary" : "btn-ghost"}`}
            aria-label={`${isPlaying ? "Pause" : "Play preview of"} ${item?.song.title ?? "song"}`}
            aria-pressed={isPlaying}
            onClick={() => (active ? player.toggle() : player.play(queue, index))}
        >
            {isPlaying ? <LuPause aria-hidden /> : <LuPlay aria-hidden />}
        </button>
    );
}

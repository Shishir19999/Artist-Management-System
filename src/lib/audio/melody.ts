import { hashString } from "@/lib/client/format";
import type { GenreKey } from "@/lib/domain/constants";

export interface MelodyNote {
    /** start offset in seconds */
    t: number;
    dur: number;
    freq: number;
    gain: number;
    wave: "sine" | "triangle" | "square" | "sawtooth";
}

export interface Melody {
    notes: MelodyNote[];
    length: number;
}

interface Style {
    scale: number[]; // semitone offsets from the root
    bpm: number;
    wave: MelodyNote["wave"];
    root: number; // MIDI note
    rest: number; // probability of a rest
}

const MAJOR_PENTA = [0, 2, 4, 7, 9];
const MINOR_PENTA = [0, 3, 5, 7, 10];
const BLUES = [0, 3, 5, 6, 7, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

const STYLES: Record<GenreKey, Style> = {
    RNB: { scale: DORIAN, bpm: 88, wave: "triangle", root: 57, rest: 0.25 },
    COUNTRY: { scale: MAJOR_PENTA, bpm: 108, wave: "triangle", root: 55, rest: 0.15 },
    CLASSIC: { scale: MAJOR, bpm: 76, wave: "sine", root: 60, rest: 0.1 },
    ROCK: { scale: MINOR_PENTA, bpm: 128, wave: "sawtooth", root: 52, rest: 0.1 },
    JAZZ: { scale: DORIAN, bpm: 96, wave: "sine", root: 58, rest: 0.3 },
    POP: { scale: MAJOR_PENTA, bpm: 118, wave: "square", root: 60, rest: 0.15 },
    HIPHOP: { scale: MINOR_PENTA, bpm: 92, wave: "square", root: 48, rest: 0.35 },
    ELECTRONIC: { scale: MINOR_PENTA, bpm: 124, wave: "sawtooth", root: 57, rest: 0.2 },
    FOLK: { scale: MAJOR_PENTA, bpm: 96, wave: "triangle", root: 57, rest: 0.2 },
    BLUES: { scale: BLUES, bpm: 82, wave: "triangle", root: 55, rest: 0.25 },
};

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Small deterministic PRNG so a song always sounds the same. */
function mulberry32(seed: number) {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Builds a short synthesized preview (no audio files): a random walk over the genre's scale plus a bass line.
 * Pure function so it can be unit tested without WebAudio.
 */
export function buildMelody(seed: string, genre: GenreKey, maxSeconds = 16): Melody {
    const style = STYLES[genre] ?? STYLES.POP;
    const rand = mulberry32(hashString(`${seed}:${genre}`));
    const beat = 60 / style.bpm;
    const step = beat / 2; // eighth notes
    const total = Math.max(4, maxSeconds);
    const notes: MelodyNote[] = [];
    let degree = Math.floor(rand() * style.scale.length);
    let octave = 1;

    for (let t = 0, i = 0; t < total - 0.01; t += step, i++) {
        // bass on every half bar
        if (i % 4 === 0) {
            const bassDegree = [0, 0, 3 % style.scale.length, 4 % style.scale.length][Math.floor(i / 4) % 4];
            notes.push({
                t,
                dur: Math.min(beat * 1.9, total - t),
                freq: midiToHz(style.root - 12 + style.scale[bassDegree]),
                gain: 0.22,
                wave: "sine",
            });
        }
        if (rand() < style.rest) continue;
        const move = Math.floor(rand() * 5) - 2; // -2..2
        degree += move;
        if (degree < 0) {
            degree += style.scale.length;
            octave = Math.max(0, octave - 1);
        } else if (degree >= style.scale.length) {
            degree -= style.scale.length;
            octave = Math.min(2, octave + 1);
        }
        const long = rand() < 0.25;
        notes.push({
            t,
            dur: Math.min(long ? step * 2 : step * 0.9, total - t),
            freq: midiToHz(style.root + 12 * octave + style.scale[degree]),
            gain: 0.12,
            wave: style.wave,
        });
    }
    return { notes, length: total };
}

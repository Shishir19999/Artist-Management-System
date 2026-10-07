import type { GenreKey } from "./constants";
import type { ArtistDTO, GigDTO, SongDTO } from "./types";

export interface Analytics {
    totals: { artists: number; songs: number; users: number | null; upcomingGigs: number; totalDurationSec: number };
    artistsByGenre: { genre: GenreKey; count: number }[];
    songsByGenre: { genre: GenreKey; count: number }[];
    songsPerYear: { year: number; count: number }[];
    topArtists: { id: string; name: string; songs: number }[];
    upcomingGigs: GigDTO[];
}

const byCountDesc = <T extends { count: number }>(a: T, b: T) => b.count - a.count;

/** Aggregates the lists a user is allowed to see into the numbers shown on the dashboard. */
export function buildAnalytics(input: {
    artists: Pick<ArtistDTO, "id" | "name">[];
    songs: Pick<SongDTO, "genre" | "artistId" | "releaseDate" | "durationSec">[];
    gigs: GigDTO[];
    userCount: number | null;
    now?: Date;
}): Analytics {
    const now = input.now ?? new Date();
    const songsByGenreMap = new Map<GenreKey, number>();
    const perArtist = new Map<string, Map<GenreKey, number>>();
    const years = new Map<number, number>();
    let totalDurationSec = 0;

    for (const s of input.songs) {
        songsByGenreMap.set(s.genre, (songsByGenreMap.get(s.genre) ?? 0) + 1);
        if (s.artistId) {
            const g = perArtist.get(s.artistId) ?? new Map<GenreKey, number>();
            g.set(s.genre, (g.get(s.genre) ?? 0) + 1);
            perArtist.set(s.artistId, g);
        }
        if (s.releaseDate) {
            const y = new Date(s.releaseDate).getUTCFullYear();
            if (!Number.isNaN(y)) years.set(y, (years.get(y) ?? 0) + 1);
        }
        totalDurationSec += s.durationSec ?? 0;
    }

    // an artist counts towards the genre of most of their songs (ties: alphabetical, so it is stable)
    const artistsByGenreMap = new Map<GenreKey, number>();
    for (const a of input.artists) {
        const g = perArtist.get(a.id);
        if (!g) continue;
        const [top] = [...g.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));
        artistsByGenreMap.set(top[0], (artistsByGenreMap.get(top[0]) ?? 0) + 1);
    }

    const yearKeys = [...years.keys()].sort((a, b) => a - b);
    const songsPerYear: { year: number; count: number }[] = [];
    if (yearKeys.length) {
        const last = yearKeys[yearKeys.length - 1];
        const first = Math.max(yearKeys[0], last - 40);
        for (let y = first; y <= last; y++) songsPerYear.push({ year: y, count: years.get(y) ?? 0 });
    }

    const topArtists = input.artists
        .map((a) => ({ id: a.id, name: a.name, songs: [...(perArtist.get(a.id)?.values() ?? [])].reduce((x, y) => x + y, 0) }))
        .filter((a) => a.songs > 0)
        .sort((a, b) => b.songs - a.songs || a.name.localeCompare(b.name))
        .slice(0, 5);

    const upcoming = input.gigs
        .filter((g) => g.status !== "CANCELLED" && g.status !== "COMPLETED" && new Date(g.date).getTime() >= now.getTime())
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

    return {
        totals: {
            artists: input.artists.length,
            songs: input.songs.length,
            users: input.userCount,
            upcomingGigs: upcoming.length,
            totalDurationSec,
        },
        artistsByGenre: [...artistsByGenreMap].map(([genre, count]) => ({ genre, count })).sort(byCountDesc),
        songsByGenre: [...songsByGenreMap].map(([genre, count]) => ({ genre, count })).sort(byCountDesc),
        songsPerYear,
        topArtists,
        upcomingGigs: upcoming.slice(0, 5),
    };
}

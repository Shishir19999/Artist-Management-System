"use client";
import { useMemo } from "react";
import type { ActivityDTO, ArtistDTO, FavoriteDTO, GigDTO, PlaylistDTO, SongDTO, UserDTO } from "@/lib/domain/types";
import { useApi } from "./use-api";

export function useArtists() {
    const r = useApi<{ artists: ArtistDTO[] }>("/api/artists");
    const artists = useMemo(() => r.data?.artists ?? [], [r.data]);
    const byId = useMemo(() => new Map(artists.map((a) => [a.id, a])), [artists]);
    return { ...r, artists, byId };
}

export function useSongs() {
    const r = useApi<{ musics: SongDTO[] }>("/api/musics");
    const songs = useMemo(() => r.data?.musics ?? [], [r.data]);
    const byId = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
    return { ...r, songs, byId };
}

export function useGigs() {
    const r = useApi<{ gigs: GigDTO[] }>("/api/gigs");
    const gigs = useMemo(() => r.data?.gigs ?? [], [r.data]);
    return { ...r, gigs };
}

export function usePlaylists() {
    const r = useApi<{ playlists: PlaylistDTO[] }>("/api/playlists");
    const playlists = useMemo(() => r.data?.playlists ?? [], [r.data]);
    return { ...r, playlists };
}

export function useFavorites() {
    const r = useApi<{ favorites: FavoriteDTO[] }>("/api/favorites");
    const favorites = useMemo(() => r.data?.favorites ?? [], [r.data]);
    const keys = useMemo(() => new Set(favorites.map((f) => `${f.targetType}:${f.targetId}`)), [favorites]);
    return { ...r, favorites, isFavorite: (type: FavoriteDTO["targetType"], id: string) => keys.has(`${type}:${id}`) };
}

export function useUsers(enabled: boolean) {
    const r = useApi<{ users: UserDTO[] }>(enabled ? "/api/users" : null);
    const users = useMemo(() => r.data?.users ?? [], [r.data]);
    return { ...r, users };
}

export function useActivity(opts: { userId?: string; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (opts.userId) q.set("userId", opts.userId);
    q.set("limit", String(opts.limit ?? 50));
    const r = useApi<{ activity: ActivityDTO[] }>(`/api/activity?${q}`);
    const activity = useMemo(() => r.data?.activity ?? [], [r.data]);
    return { ...r, activity };
}

export function useMe() {
    const r = useApi<{ user: UserDTO }>("/api/me");
    return { ...r, me: r.data?.user };
}

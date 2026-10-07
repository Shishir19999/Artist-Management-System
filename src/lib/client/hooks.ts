"use client";
import { useMemo } from "react";
import type { ActivityDTO, ArtistDTO, FavoriteDTO, GigDTO, PlaylistDTO, SongDTO, UserDTO } from "@/lib/domain/types";
import { useAuth } from "./auth";
import { useApi } from "./use-api";

/** Listeners have no artist directory (the server refuses it), so they never ask for it. */
export function useArtists() {
    const { user } = useAuth();
    const r = useApi<{ artists: ArtistDTO[] }>(user && user.role !== "USER" ? "/api/artists" : null);
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
    const { user } = useAuth();
    const r = useApi<{ gigs: GigDTO[] }>(user && (user.role === "ARTIST_MANAGER" || user.role === "ARTIST") ? "/api/gigs" : null);
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

/** The audit trail belongs to the Artist Manager. */
export function useActivity(opts: { userId?: string; limit?: number } = {}) {
    const { user } = useAuth();
    const enabled = user?.role === "ARTIST_MANAGER";
    const q = new URLSearchParams();
    if (opts.userId) q.set("userId", opts.userId);
    q.set("limit", String(opts.limit ?? 50));
    const r = useApi<{ activity: ActivityDTO[] }>(enabled ? `/api/activity?${q}` : null);
    const activity = useMemo(() => r.data?.activity ?? [], [r.data]);
    return { ...r, activity };
}

export function useMe() {
    const r = useApi<{ user: UserDTO }>("/api/me");
    return { ...r, me: r.data?.user };
}

/** The artist record linked to the signed-in Artist account (null for every other role, or before it loads). */
export function useOwnArtistId(): string | null {
    const { user } = useAuth();
    const { artists } = useArtists();
    if (user?.role !== "ARTIST") return null;
    return artists.find((a) => a.createdBy === user.id)?.id ?? null;
}

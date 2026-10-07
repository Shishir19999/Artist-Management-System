import type { AppRole } from "@/lib/roles";
import type { ActivityAction, ActivityEntity, GenderKey, GenreKey, GigStatus } from "./constants";

/** JSON shapes exchanged with /api (identical in real mode and in the browser-only demo). */

export interface ArtistDTO {
    id: string;
    name: string;
    email: string | null;
    gender: GenderKey;
    first_release_year: string | null;
    total_albums: number | null;
    address: string | null;
    bio: string | null;
    photo: string | null; // data URL
    website: string | null;
    instagram: string | null;
    youtube: string | null;
    spotify: string | null;
    createdBy: string | null;
    created_at: string;
    updated_at: string;
}

export interface SongDTO {
    id: string;
    title: string;
    album: string | null;
    genre: GenreKey;
    artistId: string | null;
    durationSec: number | null;
    releaseDate: string | null; // ISO date-time (midnight UTC)
    coverUrl: string | null; // data URL
    /** name of the artist, so listeners (who have no artist directory) can still show it */
    artistName?: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserDTO {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    gender: GenderKey;
    role: AppRole;
    phone?: string | null;
    address?: string | null;
    birthDate?: string | null; // YYYY-MM-DD
}

export interface PlaylistDTO {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    songIds: string[]; // ordered
    created_at: string;
    updated_at: string;
}

export interface FavoriteDTO {
    targetType: "ARTIST" | "SONG";
    targetId: string;
}

export interface GigDTO {
    id: string;
    artistId: string;
    title: string;
    venue: string;
    city: string | null;
    date: string; // ISO date-time
    status: GigStatus;
    fee: number | null;
    notes: string | null;
    createdBy: string | null;
    created_at: string;
}

export interface ActivityDTO {
    id: string;
    userId: string | null;
    userName: string | null;
    action: ActivityAction;
    entity: ActivityEntity;
    entityId: string | null;
    summary: string;
    created_at: string;
}

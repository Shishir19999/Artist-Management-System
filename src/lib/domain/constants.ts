import type { AppRole } from "@/lib/roles";

export const GENRES = ["RNB", "COUNTRY", "CLASSIC", "ROCK", "JAZZ", "POP", "HIPHOP", "ELECTRONIC", "FOLK", "BLUES"] as const;
export type GenreKey = (typeof GENRES)[number];

export const GENRE_LABEL: Record<GenreKey, string> = {
    RNB: "R&B",
    COUNTRY: "Country",
    CLASSIC: "Classical",
    ROCK: "Rock",
    JAZZ: "Jazz",
    POP: "Pop",
    HIPHOP: "Hip-hop",
    ELECTRONIC: "Electronic",
    FOLK: "Folk",
    BLUES: "Blues",
};

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export type GenderKey = (typeof GENDERS)[number];

export const GIG_STATUSES = ["HOLD", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
export type GigStatus = (typeof GIG_STATUSES)[number];

export const ACTIVITY_ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "REGISTER"] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_ENTITIES = ["ARTIST", "SONG", "USER", "GIG", "PLAYLIST", "PROFILE", "SESSION"] as const;
export type ActivityEntity = (typeof ACTIVITY_ENTITIES)[number];

export const ROLE_LABEL: Record<AppRole, string> = {
    ADMIN: "Admin",
    ARTIST_MANAGER: "Artist manager",
    USER: "User",
};

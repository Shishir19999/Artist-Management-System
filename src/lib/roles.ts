// Edge-safe (no prisma/bcrypt imports) so it can be used by the proxy too.
export const ROLES = ["USER", "ARTIST_MANAGER", "ADMIN"] as const;
export type AppRole = (typeof ROLES)[number];

export function isRole(value: unknown): value is AppRole {
    return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

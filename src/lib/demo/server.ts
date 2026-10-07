import { ArtistSchema } from "@/app/api/artists/ArtistSchema";
import { MusicSchema } from "@/app/api/musics/MusicSchema";
import { UserSchema, UserUpdateSchema } from "@/app/api/users/UserSchema";
import { RegisterSchema } from "@/app/api/auth/register/RegisterSchema";
import { decideAccess } from "@/lib/domain/access";
import { FavoriteSchema, GigSchema, PlaylistSchema, ProfileSchema, cleanOpt } from "@/lib/domain/schemas";
import { dateOnly } from "@/lib/domain/dates";
import type { ActivityAction, ActivityEntity } from "@/lib/domain/constants";
import type { ArtistDTO, GigDTO, PlaylistDTO, SongDTO, UserDTO } from "@/lib/domain/types";
import type { DemoDb, DemoUser } from "./seed";

/**
 * In-browser stand-in for the /api routes. Same URLs, payloads, status codes and authorization rules
 * as the real route handlers, but it works on a plain object so it can run without a server.
 */

export interface DemoRequest {
    method: string;
    path: string; // e.g. /api/artists/a_1
    query: URLSearchParams;
    body: unknown;
}

export interface DemoResponse {
    status: number;
    data: unknown;
}

const json = (status: number, data: unknown): DemoResponse => ({ status, data });
const err = (status: number, message: string) => json(status, { error: message });
const MAX_ROWS = 5000;

const publicUser = (u: DemoUser): UserDTO => ({ id: u.id, name: u.name, email: u.email, image: u.image, gender: u.gender, role: u.role });
const canManage = (role: string) => role === "ADMIN" || role === "ARTIST_MANAGER";
const nowIso = () => new Date().toISOString();

export function nextId(db: DemoDb, prefix: string): string {
    db.counter += 1;
    return `${prefix}_${db.counter}`;
}

export function log(db: DemoDb, actor: DemoUser | null, action: ActivityAction, entity: ActivityEntity, entityId: string | null, summary: string) {
    db.activity.unshift({
        id: nextId(db, "l"),
        userId: actor?.id ?? null,
        userName: actor?.name ?? null,
        action,
        entity,
        entityId,
        summary,
        created_at: nowIso(),
    });
    if (db.activity.length > 400) db.activity.length = 400;
}

function visibleArtists(db: DemoDb, user: DemoUser): ArtistDTO[] {
    return canManage(user.role) ? db.artists : db.artists.filter((a) => a.createdBy === user.id);
}

function visibleSongs(db: DemoDb, user: DemoUser): SongDTO[] {
    if (canManage(user.role)) return db.songs;
    const ids = new Set(visibleArtists(db, user).map((a) => a.id));
    return db.songs.filter((s) => s.artistId && ids.has(s.artistId));
}

function playlistOwned(db: DemoDb, user: DemoUser, id: string): PlaylistDTO | undefined {
    const p = db.playlists.find((x) => x.id === id);
    return p && p.ownerId === user.id ? p : undefined;
}

const zodFail = (error: { issues: unknown }) => json(400, { error: error.issues });

export function handleDemoRequest(db: DemoDb, sessionUserId: string | null, req: DemoRequest): DemoResponse {
    const { method, path, query, body } = req;
    const seg = path.replace(/^\/api\//, "").replace(/\/+$/, "").split("/");
    const [resource, id] = seg;

    // public: sign-up
    if (resource === "auth" && id === "register" && method === "POST") {
        const parsed = RegisterSchema.safeParse(body);
        if (!parsed.success) return zodFail(parsed.error);
        const d = parsed.data;
        if (db.users.some((u) => u.email.toLowerCase() === d.email)) return err(400, "Email is already used!");
        const user: DemoUser = { id: nextId(db, "u"), name: d.name, email: d.email, password: d.password, role: "USER", gender: "MALE", image: null };
        db.users.push(user);
        log(db, user, "REGISTER", "USER", user.id, `Registered ${user.name}`);
        return json(201, { user: publicUser(user) });
    }

    const user = sessionUserId ? db.users.find((u) => u.id === sessionUserId) : undefined;
    if (!user) return err(401, "Unauthenticated");
    if (decideAccess({ pathname: path, method, role: user.role }) === "deny") return err(403, "Forbidden");

    switch (resource) {
        case "artists":
            return artists(db, user, method, id, body);
        case "musics":
            return musics(db, user, method, id, body);
        case "gigs":
            return gigs(db, user, method, id, query, body);
        case "users":
            return users(db, user, method, id, body);
        case "playlists":
            return playlists(db, user, method, id, body);
        case "favorites":
            return favorites(db, user, method, body);
        case "activity":
            return activity(db, user, query);
        case "me":
            return me(db, user, method, body);
        default:
            return err(404, "Not found");
    }
}

function artists(db: DemoDb, user: DemoUser, method: string, id: string | undefined, body: unknown): DemoResponse {
    if (!id) {
        if (method === "GET") {
            const list = visibleArtists(db, user);
            return json(200, { artists: list, total_count: list.length });
        }
        if (method === "POST") {
            const parsed = ArtistSchema.safeParse(body);
            if (!parsed.success) return zodFail(parsed.error);
            const d = parsed.data;
            if (d.email && db.artists.some((a) => a.email?.toLowerCase() === d.email!.toLowerCase())) return err(400, "Email is already in use.");
            if (db.artists.length >= MAX_ROWS) return err(400, "Demo storage is full. Reset the demo data.");
            const ts = nowIso();
            const artist: ArtistDTO = {
                id: nextId(db, "a"),
                name: d.name,
                email: d.email ?? null,
                gender: d.gender,
                first_release_year: d.first_release_year,
                total_albums: d.total_albums,
                address: d.address,
                bio: cleanOpt(d.bio) ?? null,
                photo: cleanOpt(d.photo) ?? null,
                website: cleanOpt(d.website) ?? null,
                instagram: cleanOpt(d.instagram) ?? null,
                youtube: cleanOpt(d.youtube) ?? null,
                spotify: cleanOpt(d.spotify) ?? null,
                createdBy: user.id,
                created_at: ts,
                updated_at: ts,
            };
            db.artists.push(artist);
            log(db, user, "CREATE", "ARTIST", artist.id, `Created artist ${artist.name}`);
            return json(200, { newArtist: artist });
        }
        return err(405, "Method not allowed");
    }

    const artist = db.artists.find((a) => a.id === id);
    if (method === "GET") {
        if (!artist || (!canManage(user.role) && artist.createdBy !== user.id)) return err(404, "artist not found!");
        return json(200, { artist: { ...artist, music: db.songs.filter((s) => s.artistId === artist.id) } });
    }
    if (!artist) return err(404, method === "PUT" ? "artist Not Found!" : "artist not found");
    if (method === "PUT") {
        const parsed = ArtistSchema.safeParse(body);
        if (!parsed.success) return zodFail(parsed.error);
        const d = parsed.data;
        if (d.email && db.artists.some((a) => a.id !== artist.id && a.email?.toLowerCase() === d.email!.toLowerCase())) return err(400, "Email is already in use.");
        Object.assign(artist, {
            name: d.name,
            email: d.email ?? null,
            gender: d.gender,
            first_release_year: d.first_release_year,
            total_albums: d.total_albums,
            address: d.address,
            bio: cleanOpt(d.bio) ?? null,
            photo: cleanOpt(d.photo) ?? null,
            website: cleanOpt(d.website) ?? null,
            instagram: cleanOpt(d.instagram) ?? null,
            youtube: cleanOpt(d.youtube) ?? null,
            spotify: cleanOpt(d.spotify) ?? null,
            updated_at: nowIso(),
        });
        log(db, user, "UPDATE", "ARTIST", artist.id, `Updated artist ${artist.name}`);
        return json(200, { updatedData: artist });
    }
    if (method === "DELETE") {
        db.artists = db.artists.filter((a) => a.id !== artist.id);
        db.favorites = db.favorites.filter((f) => !(f.targetType === "ARTIST" && f.targetId === artist.id));
        db.gigs = db.gigs.filter((g) => g.artistId !== artist.id);
        for (const s of db.songs) if (s.artistId === artist.id) s.artistId = null;
        log(db, user, "DELETE", "ARTIST", artist.id, `Deleted artist ${artist.name}`);
        return json(200, { deletedArtist: artist, msg: "artist deleted successfully!" });
    }
    return err(405, "Method not allowed");
}

function musics(db: DemoDb, user: DemoUser, method: string, id: string | undefined, body: unknown): DemoResponse {
    if (!id) {
        if (method === "GET") {
            const list = visibleSongs(db, user);
            return json(200, { musics: list, total_count: list.length });
        }
        if (method === "POST") {
            const parsed = MusicSchema.safeParse(body);
            if (!parsed.success) return zodFail(parsed.error);
            const d = parsed.data;
            if (!d.artistId) return err(400, "Artist ID is required.");
            if (!db.artists.some((a) => a.id === d.artistId)) return err(400, "Artist not found for the provided Artist ID");
            if (db.songs.length >= MAX_ROWS) return err(400, "Demo storage is full. Reset the demo data.");
            const ts = nowIso();
            const song: SongDTO = {
                id: nextId(db, "s"),
                title: d.title,
                album: d.album,
                genre: d.genre,
                artistId: d.artistId,
                durationSec: cleanOpt(d.durationSec) ?? null,
                releaseDate: dateOnly(d.releaseDate)?.toISOString() ?? null,
                coverUrl: cleanOpt(d.coverUrl) ?? null,
                created_at: ts,
                updated_at: ts,
            };
            db.songs.push(song);
            log(db, user, "CREATE", "SONG", song.id, `Created song ${song.title}`);
            return json(200, { data: song });
        }
        return err(405, "Method not allowed");
    }

    const song = db.songs.find((s) => s.id === id);
    if (method === "GET") {
        if (!song || !visibleSongs(db, user).includes(song)) return err(404, "Music not found!");
        const owner = db.artists.find((a) => a.id === song.artistId);
        return json(200, { music: { ...song, artist: owner ? { name: owner.name } : null } });
    }
    if (!song) return err(404, "Music not found!");
    if (method === "PUT") {
        const parsed = MusicSchema.safeParse(body);
        if (!parsed.success) return zodFail(parsed.error);
        const d = parsed.data;
        if (d.artistId && !db.artists.some((a) => a.id === d.artistId)) return err(400, "Artist not found for the provided Artist ID");
        Object.assign(song, {
            title: d.title,
            album: d.album,
            genre: d.genre,
            ...(d.artistId ? { artistId: d.artistId } : {}),
            durationSec: cleanOpt(d.durationSec) === undefined ? song.durationSec : cleanOpt(d.durationSec),
            releaseDate: d.releaseDate === undefined ? song.releaseDate : (dateOnly(d.releaseDate)?.toISOString() ?? null),
            coverUrl: cleanOpt(d.coverUrl) === undefined ? song.coverUrl : cleanOpt(d.coverUrl),
            updated_at: nowIso(),
        });
        log(db, user, "UPDATE", "SONG", song.id, `Updated song ${song.title}`);
        return json(200, { updatedData: song });
    }
    if (method === "DELETE") {
        db.songs = db.songs.filter((s) => s.id !== song.id);
        db.favorites = db.favorites.filter((f) => !(f.targetType === "SONG" && f.targetId === song.id));
        for (const p of db.playlists) p.songIds = p.songIds.filter((x) => x !== song.id);
        log(db, user, "DELETE", "SONG", song.id, `Deleted song ${song.title}`);
        return json(200, { deletedMusic: song, msg: "Music deleted successfully!" });
    }
    return err(405, "Method not allowed");
}

function gigs(db: DemoDb, user: DemoUser, method: string, id: string | undefined, query: URLSearchParams, body: unknown): DemoResponse {
    const visibleIds = new Set(visibleArtists(db, user).map((a) => a.id));
    const sorted = () => [...db.gigs].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    if (!id) {
        if (method === "GET") {
            const artistId = query.get("artistId");
            const list = sorted().filter((g) => (!artistId || g.artistId === artistId) && visibleIds.has(g.artistId));
            return json(200, { gigs: list, total_count: list.length });
        }
        if (method === "POST") {
            const parsed = GigSchema.safeParse(body);
            if (!parsed.success) return zodFail(parsed.error);
            const d = parsed.data;
            const artist = db.artists.find((a) => a.id === d.artistId);
            if (!artist) return err(400, "Artist not found for the provided Artist ID");
            const gig: GigDTO = {
                id: nextId(db, "g"),
                artistId: d.artistId,
                title: d.title,
                venue: d.venue,
                city: cleanOpt(d.city) ?? null,
                date: new Date(d.date).toISOString(),
                status: d.status,
                fee: cleanOpt(d.fee) ?? null,
                notes: cleanOpt(d.notes) ?? null,
                createdBy: user.id,
                created_at: nowIso(),
            };
            db.gigs.push(gig);
            log(db, user, "CREATE", "GIG", gig.id, `Created gig ${gig.title} for ${artist.name}`);
            return json(201, { gig });
        }
        return err(405, "Method not allowed");
    }
    const gig = db.gigs.find((g) => g.id === id);
    if (method === "GET") {
        if (!gig || !visibleIds.has(gig.artistId)) return err(404, "Gig not found!");
        return json(200, { gig });
    }
    if (!gig) return err(404, "Gig not found!");
    if (method === "PUT") {
        const parsed = GigSchema.safeParse(body);
        if (!parsed.success) return zodFail(parsed.error);
        const d = parsed.data;
        if (!db.artists.some((a) => a.id === d.artistId)) return err(400, "Artist not found for the provided Artist ID");
        Object.assign(gig, {
            artistId: d.artistId,
            title: d.title,
            venue: d.venue,
            city: cleanOpt(d.city) ?? null,
            date: new Date(d.date).toISOString(),
            status: d.status,
            fee: cleanOpt(d.fee) ?? null,
            notes: cleanOpt(d.notes) ?? null,
        });
        log(db, user, "UPDATE", "GIG", gig.id, `Updated gig ${gig.title}`);
        return json(200, { gig });
    }
    if (method === "DELETE") {
        db.gigs = db.gigs.filter((g) => g.id !== gig.id);
        log(db, user, "DELETE", "GIG", gig.id, `Deleted gig ${gig.title}`);
        return json(200, { gig, msg: "Gig deleted successfully!" });
    }
    return err(405, "Method not allowed");
}

function users(db: DemoDb, user: DemoUser, method: string, id: string | undefined, body: unknown): DemoResponse {
    if (!id) {
        if (user.role !== "ADMIN") return err(403, "Forbidden");
        if (method === "GET") return json(200, { users: db.users.map(publicUser), total_count: db.users.length });
        if (method === "POST") {
            const parsed = UserSchema.safeParse(body);
            if (!parsed.success) return zodFail(parsed.error);
            const d = parsed.data;
            if (db.users.some((u) => u.email.toLowerCase() === d.email.toLowerCase())) return err(400, "Email is already used!");
            const created: DemoUser = { id: nextId(db, "u"), name: d.name, email: d.email, password: d.password, role: d.role ?? "USER", gender: "MALE", image: null };
            db.users.push(created);
            log(db, user, "CREATE", "USER", created.id, `Created user ${created.name}`);
            return json(200, { data: publicUser(created) });
        }
        return err(405, "Method not allowed");
    }
    if (method === "GET") {
        if (user.role !== "ADMIN" && user.id !== id) return err(403, "Forbidden");
        const found = db.users.find((u) => u.id === id);
        return found ? json(200, { user: publicUser(found) }) : err(404, "User not found!");
    }
    if (user.role !== "ADMIN") return err(403, "Forbidden");
    const target = db.users.find((u) => u.id === id);
    if (!target) return err(404, "User Not Found!");
    if (method === "PUT") {
        const parsed = UserUpdateSchema.safeParse(body);
        if (!parsed.success) return zodFail(parsed.error);
        const d = parsed.data;
        if (db.users.some((u) => u.id !== target.id && u.email.toLowerCase() === d.email.toLowerCase())) return err(400, "Email is already in use.");
        if (target.id === user.id && d.role && d.role !== "ADMIN") return err(400, "You cannot change your own role.");
        target.name = d.name;
        target.email = d.email;
        if (d.password) target.password = d.password;
        if (d.role) target.role = d.role;
        log(db, user, "UPDATE", "USER", target.id, `Updated user ${target.name}`);
        return json(200, { updatedData: publicUser(target) });
    }
    if (method === "DELETE") {
        if (target.id === user.id) return err(400, "You cannot delete your own account.");
        db.users = db.users.filter((u) => u.id !== target.id);
        db.playlists = db.playlists.filter((p) => p.ownerId !== target.id);
        db.favorites = db.favorites.filter((f) => f.userId !== target.id);
        log(db, user, "DELETE", "USER", target.id, `Deleted user ${target.name}`);
        return json(200, { deletedUser: publicUser(target), msg: "User deleted successfully!" });
    }
    return err(405, "Method not allowed");
}

function playlists(db: DemoDb, user: DemoUser, method: string, id: string | undefined, body: unknown): DemoResponse {
    const allowedSongs = new Set(visibleSongs(db, user).map((s) => s.id));
    const resolve = (ids: string[]) => {
        const unique = [...new Set(ids)];
        return unique.every((s) => allowedSongs.has(s)) ? unique : null;
    };
    if (!id) {
        if (method === "GET") return json(200, { playlists: db.playlists.filter((p) => p.ownerId === user.id) });
        if (method === "POST") {
            const parsed = PlaylistSchema.safeParse(body);
            if (!parsed.success) return zodFail(parsed.error);
            const songIds = resolve(parsed.data.songIds);
            if (!songIds) return err(400, "Unknown song");
            const ts = nowIso();
            const p: PlaylistDTO = {
                id: nextId(db, "p"),
                name: parsed.data.name,
                description: cleanOpt(parsed.data.description) ?? null,
                ownerId: user.id,
                songIds,
                created_at: ts,
                updated_at: ts,
            };
            db.playlists.push(p);
            log(db, user, "CREATE", "PLAYLIST", p.id, `Created playlist ${p.name}`);
            return json(201, { playlist: p });
        }
        return err(405, "Method not allowed");
    }
    const p = playlistOwned(db, user, id);
    if (!p) return err(404, "Playlist not found!");
    if (method === "GET") return json(200, { playlist: p });
    if (method === "PUT") {
        const parsed = PlaylistSchema.safeParse(body);
        if (!parsed.success) return zodFail(parsed.error);
        const songIds = resolve(parsed.data.songIds);
        if (!songIds) return err(400, "Unknown song");
        Object.assign(p, { name: parsed.data.name, description: cleanOpt(parsed.data.description) ?? null, songIds, updated_at: nowIso() });
        log(db, user, "UPDATE", "PLAYLIST", p.id, `Updated playlist ${p.name}`);
        return json(200, { playlist: p });
    }
    if (method === "DELETE") {
        db.playlists = db.playlists.filter((x) => x.id !== p.id);
        log(db, user, "DELETE", "PLAYLIST", p.id, `Deleted playlist ${p.name}`);
        return json(200, { msg: "Playlist deleted successfully!" });
    }
    return err(405, "Method not allowed");
}

function favorites(db: DemoDb, user: DemoUser, method: string, body: unknown): DemoResponse {
    if (method === "GET") {
        return json(200, { favorites: db.favorites.filter((f) => f.userId === user.id).map((f) => ({ targetType: f.targetType, targetId: f.targetId })) });
    }
    if (method !== "POST") return err(405, "Method not allowed");
    const parsed = FavoriteSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);
    const { targetType, targetId } = parsed.data;
    const visible = targetType === "ARTIST" ? visibleArtists(db, user).some((a) => a.id === targetId) : visibleSongs(db, user).some((s) => s.id === targetId);
    if (!visible) return err(404, "Not found!");
    const idx = db.favorites.findIndex((f) => f.userId === user.id && f.targetType === targetType && f.targetId === targetId);
    if (idx >= 0) {
        db.favorites.splice(idx, 1);
        return json(200, { favorited: false });
    }
    db.favorites.push({ userId: user.id, targetType, targetId });
    return json(200, { favorited: true });
}

function activity(db: DemoDb, user: DemoUser, query: URLSearchParams): DemoResponse {
    const rawLimit = Number.parseInt(query.get("limit") ?? "", 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;
    const userId = query.get("userId");
    if (userId && user.role !== "ADMIN" && userId !== user.id) return err(403, "Forbidden");
    const rows = db.activity.filter((a) => (user.role === "ADMIN" ? !userId || a.userId === userId : a.userId === user.id));
    return json(200, { activity: rows.slice(0, limit) });
}

function me(db: DemoDb, user: DemoUser, method: string, body: unknown): DemoResponse {
    if (method === "GET") return json(200, { user: publicUser(user) });
    if (method !== "PUT") return err(405, "Method not allowed");
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);
    const d = parsed.data;
    let changedPassword = false;
    if (d.newPassword) {
        if (d.currentPassword !== user.password) return err(400, "Current password is incorrect");
        user.password = d.newPassword;
        changedPassword = true;
    }
    user.name = d.name;
    if (d.gender) user.gender = d.gender;
    if (d.image !== undefined) user.image = cleanOpt(d.image) ?? null;
    log(db, user, "UPDATE", "PROFILE", user.id, changedPassword ? "Updated profile and changed password" : "Updated profile");
    return json(200, changedPassword ? { user: publicUser(user), signOut: true } : { user: publicUser(user) });
}

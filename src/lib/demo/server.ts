import { ArtistSchema } from "@/app/api/artists/ArtistSchema";
import { MusicSchema } from "@/app/api/musics/MusicSchema";
import { DemoRegisterSchema, DemoUserSchema as UserSchema, DemoUserUpdateSchema as UserUpdateSchema } from "./schemas";
import { decideAccess } from "@/lib/domain/access";
import { canEditArtist, canEditSong } from "@/lib/client/role-policy";
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

const publicUser = (u: DemoUser): UserDTO => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    gender: u.gender,
    role: u.role,
    phone: u.phone ?? null,
    address: u.address ?? null,
    birthDate: u.birthDate ?? null,
});
const ownArtistId = (db: DemoDb, user: DemoUser) => (user.role === "ARTIST" ? (db.artists.find((a) => a.createdBy === user.id)?.id ?? null) : null);
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

// Every role reads the whole catalogue (listeners browse all music); writes are gated by decideAccess.
const visibleArtists = (db: DemoDb): ArtistDTO[] => db.artists;
const visibleSongs = (db: DemoDb): SongDTO[] => db.songs;

function playlistOwned(db: DemoDb, user: DemoUser, id: string): PlaylistDTO | undefined {
    const p = db.playlists.find((x) => x.id === id);
    return p && p.ownerId === user.id ? p : undefined;
}

/** An Artist account always has a profile of their own to fill in. */
function ensureArtistProfile(db: DemoDb, user: DemoUser) {
    if (user.role !== "ARTIST" || db.artists.some((a) => a.createdBy === user.id)) return;
    const ts = nowIso();
    const artist: ArtistDTO = {
        id: nextId(db, "a"),
        name: user.name,
        email: null,
        gender: user.gender,
        first_release_year: null,
        total_albums: null,
        address: user.address ?? null,
        bio: null,
        photo: null,
        website: null,
        instagram: null,
        youtube: null,
        spotify: null,
        createdBy: user.id,
        created_at: ts,
        updated_at: ts,
    };
    db.artists.push(artist);
    log(db, user, "CREATE", "ARTIST", artist.id, `Created artist profile ${artist.name}`);
}

const zodFail = (error: { issues: unknown }) => json(400, { error: error.issues });

export function handleDemoRequest(db: DemoDb, sessionUserId: string | null, req: DemoRequest): DemoResponse {
    const { method, path, query, body } = req;
    const seg = path.replace(/^\/api\//, "").replace(/\/+$/, "").split("/");
    const [resource, id] = seg;

    // public: sign-up
    if (resource === "auth" && id === "register" && method === "POST") {
        const parsed = DemoRegisterSchema.safeParse(body);
        if (!parsed.success) return zodFail(parsed.error);
        const d = parsed.data;
        if (db.users.some((u) => u.email.toLowerCase() === d.email)) return err(400, "Email is already used!");
        const user: DemoUser = {
            id: nextId(db, "u"),
            name: d.name,
            email: d.email,
            password: d.password,
            role: d.role,
            gender: d.gender,
            image: null,
            phone: cleanOpt(d.phone) ?? null,
            address: cleanOpt(d.address) ?? null,
            birthDate: cleanOpt(d.birthDate) ?? null,
        };
        db.users.push(user);
        log(db, user, "REGISTER", "USER", user.id, `Registered ${user.name}`);
        ensureArtistProfile(db, user);
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
            const list = visibleArtists(db);
            return json(200, { artists: list, total_count: list.length });
        }
        if (method === "POST") {
            if (user.role !== "ARTIST_MANAGER") return err(403, "Forbidden");
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
        if (!artist) return err(404, "artist not found!");
        return json(200, { artist: { ...artist, music: db.songs.filter((s) => s.artistId === artist.id) } });
    }
    if (!artist) return err(404, method === "PUT" ? "artist Not Found!" : "artist not found");
    if (!canEditArtist(user, artist) || (method === "DELETE" && user.role !== "ARTIST_MANAGER")) return err(403, "Forbidden");
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
            const names = new Map(db.artists.map((a) => [a.id, a.name]));
            const list = visibleSongs(db).map((song) => ({ ...song, artistName: song.artistId ? (names.get(song.artistId) ?? null) : null }));
            return json(200, { musics: list, total_count: list.length });
        }
        if (method === "POST") {
            const parsed = MusicSchema.safeParse(body);
            if (!parsed.success) return zodFail(parsed.error);
            const d = parsed.data;
            if (!d.artistId) return err(400, "Artist ID is required.");
            if (!db.artists.some((a) => a.id === d.artistId)) return err(400, "Artist not found for the provided Artist ID");
            if (!canEditSong(user, { artistId: d.artistId }, ownArtistId(db, user))) return err(403, "Forbidden");
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
        if (!song || !visibleSongs(db).includes(song)) return err(404, "Music not found!");
        const owner = db.artists.find((a) => a.id === song.artistId);
        return json(200, { music: { ...song, artist: owner ? { name: owner.name } : null } });
    }
    if (!song) return err(404, "Music not found!");
    if (!canEditSong(user, song, ownArtistId(db, user))) return err(403, "Forbidden");
    if (method === "PUT") {
        const parsed = MusicSchema.safeParse(body);
        if (!parsed.success) return zodFail(parsed.error);
        const d = parsed.data;
        if (d.artistId && !canEditSong(user, { artistId: d.artistId }, ownArtistId(db, user))) return err(403, "Forbidden");
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
    // an artist works with their own bookings only; the manager sees every artist
    const mine = ownArtistId(db, user);
    const visibleIds = new Set(visibleArtists(db).filter((a) => user.role === "ARTIST_MANAGER" || a.id === mine).map((a) => a.id));
    const sorted = () => [...db.gigs].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    if (!id) {
        if (method === "GET") {
            const artistId = query.get("artistId");
            const list = sorted().filter((g) => (!artistId || g.artistId === artistId) && visibleIds.has(g.artistId));
            return json(200, { gigs: list, total_count: list.length });
        }
        if (method === "POST") {
            if (user.role !== "ARTIST_MANAGER") return err(403, "Forbidden");
            const parsed = GigSchema.safeParse(body);
            if (!parsed.success) return zodFail(parsed.error);
            const d = parsed.data;
            const artist = db.artists.find((a) => a.id === d.artistId);
            if (!artist) return err(400, "Artist not found for the provided Artist ID");
            if (!visibleIds.has(artist.id)) return err(403, "Forbidden");
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
    if (!visibleIds.has(gig.artistId)) return err(403, "Forbidden");
    if (user.role !== "ARTIST_MANAGER") return err(403, "Forbidden");
    if (method === "PUT") {
        const parsed = GigSchema.safeParse(body);
        if (!parsed.success) return zodFail(parsed.error);
        const d = parsed.data;
        if (!db.artists.some((a) => a.id === d.artistId)) return err(400, "Artist not found for the provided Artist ID");
        if (!visibleIds.has(d.artistId)) return err(403, "Forbidden");
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
        if (user.role !== "ARTIST_MANAGER") return err(403, "Forbidden");
        if (method === "GET") return json(200, { users: db.users.map(publicUser), total_count: db.users.length });
        if (method === "POST") {
            const parsed = UserSchema.safeParse(body);
            if (!parsed.success) return zodFail(parsed.error);
            const d = parsed.data;
            if (db.users.some((u) => u.email.toLowerCase() === d.email.toLowerCase())) return err(400, "Email is already used!");
            const created: DemoUser = { id: nextId(db, "u"), name: d.name, email: d.email, password: d.password, role: d.role ?? "USER", gender: "MALE", image: null };
            db.users.push(created);
            ensureArtistProfile(db, created);
            log(db, user, "CREATE", "USER", created.id, `Created user ${created.name}`);
            return json(200, { data: publicUser(created) });
        }
        return err(405, "Method not allowed");
    }
    if (method === "GET") {
        if (user.role !== "ARTIST_MANAGER" && user.id !== id) return err(403, "Forbidden");
        const found = db.users.find((u) => u.id === id);
        return found ? json(200, { user: publicUser(found) }) : err(404, "User not found!");
    }
    if (user.role !== "ARTIST_MANAGER") return err(403, "Forbidden");
    const target = db.users.find((u) => u.id === id);
    if (!target) return err(404, "User Not Found!");
    if (method === "PUT") {
        const parsed = UserUpdateSchema.safeParse(body);
        if (!parsed.success) return zodFail(parsed.error);
        const d = parsed.data;
        if (db.users.some((u) => u.id !== target.id && u.email.toLowerCase() === d.email.toLowerCase())) return err(400, "Email is already in use.");
        if (target.id === user.id && d.role && d.role !== "ARTIST_MANAGER") return err(400, "You cannot change your own role.");
        target.name = d.name;
        target.email = d.email;
        if (d.password) target.password = d.password;
        if (d.role) target.role = d.role;
        ensureArtistProfile(db, target);
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
    const allowedSongs = new Set(visibleSongs(db).map((s) => s.id));
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
    const visible = targetType === "ARTIST" ? visibleArtists(db).some((a) => a.id === targetId) : visibleSongs(db).some((s) => s.id === targetId);
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
    if (userId && user.role !== "ARTIST_MANAGER" && userId !== user.id) return err(403, "Forbidden");
    const rows = db.activity.filter((a) => (user.role === "ARTIST_MANAGER" ? !userId || a.userId === userId : a.userId === user.id));
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
    if (d.phone !== undefined) user.phone = cleanOpt(d.phone) ?? null;
    if (d.address !== undefined) user.address = cleanOpt(d.address) ?? null;
    if (d.birthDate !== undefined) user.birthDate = cleanOpt(d.birthDate) ?? null;
    if (d.image !== undefined) user.image = cleanOpt(d.image) ?? null;
    log(db, user, "UPDATE", "PROFILE", user.id, changedPassword ? "Updated profile and changed password" : "Updated profile");
    return json(200, changedPassword ? { user: publicUser(user), signOut: true } : { user: publicUser(user) });
}

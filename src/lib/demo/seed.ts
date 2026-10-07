import type { AppRole } from "@/lib/roles";
import { GENRES, type GenderKey, type GenreKey } from "@/lib/domain/constants";
import type { ActivityDTO, ArtistDTO, GigDTO, PlaylistDTO, SongDTO } from "@/lib/domain/types";

/** Browser-only demo data. Everything here is fictional. */

export interface DemoUser {
    id: string;
    name: string;
    email: string;
    password: string;
    role: AppRole;
    gender: GenderKey;
    image: string | null;
}

export interface DemoFavorite {
    userId: string;
    targetType: "ARTIST" | "SONG";
    targetId: string;
}

export interface DemoDb {
    version: number;
    users: DemoUser[];
    artists: ArtistDTO[];
    songs: SongDTO[];
    gigs: GigDTO[];
    playlists: PlaylistDTO[];
    favorites: DemoFavorite[];
    activity: ActivityDTO[];
    counter: number;
}

export const DEMO_VERSION = 1;
export const DEMO_PASSWORD = "Demo@1234";

export const DEMO_ACCOUNTS: { role: AppRole; label: string; email: string; password: string; blurb: string }[] = [
    { role: "ADMIN", label: "Admin", email: "admin@example.com", password: DEMO_PASSWORD, blurb: "Everything, including users and roles" },
    { role: "ARTIST_MANAGER", label: "Artist manager", email: "manager@example.com", password: DEMO_PASSWORD, blurb: "Artists, songs and gigs" },
    { role: "USER", label: "User", email: "user@example.com", password: DEMO_PASSWORD, blurb: "Read-only view of own artists" },
];

/** Small deterministic PRNG so every browser starts from the same catalogue. */
function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const ARTIST_NAMES: [string, GenreKey, GenderKey, string][] = [
    ["Luna Marsh", "POP", "FEMALE", "Lisbon, Portugal"],
    ["The Velvet Static", "ROCK", "OTHER", "Manchester, UK"],
    ["Marcus Delacroix", "JAZZ", "MALE", "New Orleans, USA"],
    ["Aiko Tanabe", "ELECTRONIC", "FEMALE", "Osaka, Japan"],
    ["Rafael Quintero", "RNB", "MALE", "Bogota, Colombia"],
    ["Hollow Pines", "FOLK", "OTHER", "Asheville, USA"],
    ["Ines Almeida", "CLASSIC", "FEMALE", "Porto, Portugal"],
    ["Dusty Calloway", "COUNTRY", "MALE", "Nashville, USA"],
    ["Nova Kingsley", "HIPHOP", "FEMALE", "Atlanta, USA"],
    ["Blue Harbour Quartet", "BLUES", "OTHER", "Chicago, USA"],
    ["Selene Ortiz", "POP", "FEMALE", "Madrid, Spain"],
    ["Kofi Mensah", "HIPHOP", "MALE", "Accra, Ghana"],
    ["Ember & Oak", "FOLK", "OTHER", "Galway, Ireland"],
    ["Viktor Hale", "ELECTRONIC", "MALE", "Berlin, Germany"],
    ["Amara Okafor", "RNB", "FEMALE", "Lagos, Nigeria"],
    ["The Paper Lanterns", "ROCK", "OTHER", "Melbourne, Australia"],
    ["Elias Brandt", "CLASSIC", "MALE", "Vienna, Austria"],
    ["Josie Pennington", "COUNTRY", "FEMALE", "Austin, USA"],
    ["Miles Archer Trio", "JAZZ", "MALE", "Copenhagen, Denmark"],
    ["Priya Raman", "POP", "FEMALE", "Mumbai, India"],
    ["Saint Rowan", "BLUES", "MALE", "Memphis, USA"],
    ["Neon Arcade", "ELECTRONIC", "OTHER", "Stockholm, Sweden"],
    ["Camille Fournier", "FOLK", "FEMALE", "Lyon, France"],
    ["Tobias Wren", "ROCK", "MALE", "Dublin, Ireland"],
    ["Yara Haddad", "RNB", "FEMALE", "Beirut, Lebanon"],
];

const W1 = ["Midnight", "Golden", "Broken", "Silent", "Electric", "Paper", "Neon", "Velvet", "Hollow", "Restless", "Crimson", "Distant", "Faded", "Wild", "Slow", "Burning", "Quiet", "Endless", "Lucky", "Little"];
const W2 = ["Hearts", "Rivers", "Skyline", "Echoes", "Letters", "Highway", "Shadows", "Garden", "Lights", "Waves", "Embers", "Season", "Carousel", "Horizon", "Mirror", "Harbour", "Thunder", "Orchard", "Signal", "Window"];
const ALBUMS = ["Afterglow", "Northbound", "Salt & Honey", "Parallel Lines", "Small Hours", "Paper Moons", "Open Water", "Tidal", "Static Bloom", "Long Way Home", "Golden Hour", "Overtones", "Daylight Saving", "Cinder", "Wildflower Radio"];

const BIOS: Partial<Record<GenreKey, string>> = {
    POP: "Hook-driven songwriting with bright synths and a knack for a late-night singalong chorus.",
    ROCK: "Loud guitars, tight rhythm section and a live show that regularly outgrows the venue.",
    JAZZ: "Improvisational ensemble work rooted in hard bop, with a modern ear for melody.",
    ELECTRONIC: "Layered, club-ready productions that move between ambient textures and driving four-on-the-floor.",
    RNB: "Smooth vocals over warm, minimal arrangements with a modern soul sensibility.",
    FOLK: "Acoustic storytelling, close harmonies and songs that sound best around one microphone.",
    CLASSIC: "Chamber and solo repertoire performed with a contemporary, accessible approach.",
    COUNTRY: "Plainspoken lyrics, pedal steel and road-tested songs about home and the miles between.",
    HIPHOP: "Sharp, conversational rhymes over dusty drums and sampled soul.",
    BLUES: "Deep-pocket grooves and gritty guitar tone from a band that lives on the road.",
};

const VENUES: [string, string][] = [
    ["The Grand Hall", "London"], ["Riverside Amphitheatre", "Austin"], ["Blue Room", "Berlin"], ["Harbour Stage", "Lisbon"],
    ["Opera House", "Sydney"], ["The Foundry", "Chicago"], ["Cinema Club", "Madrid"], ["Aurora Arena", "Stockholm"], ["Old Mill Theatre", "Dublin"],
];

const pick = <T,>(r: () => number, list: readonly T[]) => list[Math.floor(r() * list.length)];
const iso = (d: Date) => d.toISOString();

export function buildSeed(now: Date = new Date()): DemoDb {
    const r = rng(20260701);
    const stamp = iso(new Date(now.getTime() - 30 * 86400_000));
    const users: DemoUser[] = [
        { id: "u_admin", name: "Alex Admin", email: "admin@example.com", password: DEMO_PASSWORD, role: "ADMIN", gender: "OTHER", image: null },
        { id: "u_manager", name: "Morgan Manager", email: "manager@example.com", password: DEMO_PASSWORD, role: "ARTIST_MANAGER", gender: "FEMALE", image: null },
        { id: "u_user", name: "Uma User", email: "user@example.com", password: DEMO_PASSWORD, role: "USER", gender: "FEMALE", image: null },
        { id: "u_sam", name: "Sam Rivera", email: "sam.rivera@example.com", password: DEMO_PASSWORD, role: "USER", gender: "MALE", image: null },
        { id: "u_jo", name: "Jo Bennett", email: "jo.bennett@example.com", password: DEMO_PASSWORD, role: "ARTIST_MANAGER", gender: "MALE", image: null },
    ];

    const owners = ["u_manager", "u_admin", "u_jo", "u_user"];
    const artists: ArtistDTO[] = ARTIST_NAMES.map(([name, , gender, address], i) => {
        const first = 1998 + Math.floor(r() * 22);
        const handle = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
        return {
            id: `a_${i + 1}`,
            name,
            email: `${handle}@example.com`,
            gender,
            first_release_year: String(first),
            total_albums: 1 + Math.floor(r() * 7),
            address,
            bio: BIOS[ARTIST_NAMES[i][1]] ?? null,
            photo: null,
            website: `https://example.com/${handle}`,
            instagram: `@${handle.slice(0, 18)}`,
            youtube: i % 3 === 0 ? `https://youtube.com/@${handle}` : null,
            spotify: i % 2 === 0 ? `https://open.spotify.com/artist/${handle}` : null,
            // the demo USER owns a handful of artists; the rest belong to managers
            createdBy: i < 6 ? "u_user" : owners[i % 3],
            created_at: stamp,
            updated_at: stamp,
        };
    });

    const songs: SongDTO[] = [];
    const used = new Set<string>();
    let n = 0;
    for (let i = 0; i < artists.length; i++) {
        const home = ARTIST_NAMES[i][1];
        const count = 4 + Math.floor(r() * 3); // 4-6 per artist -> ~120
        const albums = [pick(r, ALBUMS), pick(r, ALBUMS)];
        const firstYear = Number(artists[i].first_release_year);
        for (let k = 0; k < count; k++) {
            let title = "";
            do title = `${pick(r, W1)} ${pick(r, W2)}`;
            while (used.has(title));
            used.add(title);
            const year = Math.min(2026, firstYear + Math.floor(r() * (2026 - firstYear + 1)));
            const month = 1 + Math.floor(r() * 12);
            const day = 1 + Math.floor(r() * 28);
            n++;
            songs.push({
                id: `s_${n}`,
                title,
                album: albums[k % 2],
                genre: r() < 0.85 ? home : pick(r, GENRES),
                artistId: artists[i].id,
                durationSec: 110 + Math.floor(r() * 230),
                releaseDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00.000Z`,
                coverUrl: null,
                created_at: stamp,
                updated_at: stamp,
            });
        }
    }

    const gigs: GigDTO[] = [];
    const statuses: GigDTO["status"][] = ["CONFIRMED", "CONFIRMED", "HOLD", "COMPLETED", "CANCELLED"];
    for (let g = 0; g < 36; g++) {
        const artist = artists[(g * 7) % artists.length];
        const [venue, city] = pick(r, VENUES);
        const offset = Math.floor(r() * 120) - 40; // days from today
        const date = new Date(now.getTime() + offset * 86400_000);
        date.setUTCHours(19 + Math.floor(r() * 3), 0, 0, 0);
        let status = pick(r, statuses);
        if (offset < 0 && status !== "CANCELLED") status = "COMPLETED";
        if (offset >= 0 && status === "COMPLETED") status = "CONFIRMED";
        gigs.push({
            id: `g_${g + 1}`,
            artistId: artist.id,
            title: pick(r, ["Summer Session", "Album Release Show", "Acoustic Evening", "Festival Slot", "Late Night Set", "Anniversary Tour"]),
            venue,
            city,
            date: iso(date),
            status,
            fee: 500 + Math.floor(r() * 40) * 250,
            notes: null,
            createdBy: artist.createdBy,
            created_at: stamp,
        });
    }

    const playlists: PlaylistDTO[] = [
        { id: "p_1", name: "Road trip", description: "Long drive favourites", ownerId: "u_user", songIds: songs.slice(0, 12).map((s) => s.id), created_at: stamp, updated_at: stamp },
        { id: "p_2", name: "Focus", description: "Calm and instrumental", ownerId: "u_user", songIds: songs.filter((s) => s.genre === "CLASSIC" || s.genre === "JAZZ").slice(0, 10).map((s) => s.id), created_at: stamp, updated_at: stamp },
        { id: "p_3", name: "Showcase picks", description: "Candidates for the spring showcase", ownerId: "u_manager", songIds: songs.slice(30, 44).map((s) => s.id), created_at: stamp, updated_at: stamp },
        { id: "p_4", name: "Admin mix", description: null, ownerId: "u_admin", songIds: songs.slice(60, 70).map((s) => s.id), created_at: stamp, updated_at: stamp },
    ];

    const favorites: DemoFavorite[] = [
        { userId: "u_user", targetType: "ARTIST", targetId: "a_1" },
        { userId: "u_user", targetType: "SONG", targetId: songs[2].id },
        { userId: "u_user", targetType: "SONG", targetId: songs[7].id },
        { userId: "u_manager", targetType: "ARTIST", targetId: "a_3" },
        { userId: "u_admin", targetType: "ARTIST", targetId: "a_4" },
    ];

    const activity: ActivityDTO[] = [];
    const seedActs: [string, string, ActivityDTO["action"], ActivityDTO["entity"], string][] = [
        ["u_manager", "Morgan Manager", "CREATE", "ARTIST", "Created artist Hollow Pines"],
        ["u_manager", "Morgan Manager", "CREATE", "SONG", "Created song Midnight Hearts"],
        ["u_admin", "Alex Admin", "UPDATE", "USER", "Updated user Jo Bennett"],
        ["u_manager", "Morgan Manager", "CREATE", "GIG", "Created gig Summer Session for Luna Marsh"],
        ["u_user", "Uma User", "CREATE", "PLAYLIST", "Created playlist Road trip"],
        ["u_admin", "Alex Admin", "UPDATE", "ARTIST", "Updated artist Viktor Hale"],
        ["u_jo", "Jo Bennett", "CREATE", "SONG", "Created song Golden Rivers"],
        ["u_user", "Uma User", "LOGIN", "SESSION", "Signed in"],
    ];
    seedActs.forEach(([userId, userName, action, entity, summary], i) => {
        activity.push({
            id: `l_${i + 1}`,
            userId,
            userName,
            action,
            entity,
            entityId: null,
            summary,
            created_at: iso(new Date(now.getTime() - (i + 1) * 3 * 3600_000)),
        });
    });

    return { version: DEMO_VERSION, users, artists, songs, gigs, playlists, favorites, activity, counter: 1000 };
}

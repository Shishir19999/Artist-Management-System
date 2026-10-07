import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcrypt";

const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(process.env.DATABASE_URL as string),
});

type Genre = "RNB" | "COUNTRY" | "CLASSIC" | "ROCK" | "JAZZ" | "POP" | "HIPHOP" | "ELECTRONIC" | "FOLK" | "BLUES";
type Song = [title: string, album: string, genre: Genre, durationSec: number, releaseDate: string];
type SeedArtist = {
    name: string;
    email: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    year: string;
    albums: number;
    owner: "manager" | "user";
    bio: string;
    website?: string;
    instagram?: string;
    songs: Song[];
};

const ARTISTS: SeedArtist[] = [
    { name: "Aurora Vale", email: "aurora@artist.local", gender: "FEMALE", year: "2015", albums: 3, owner: "manager",
      bio: "Dream-pop vocalist blending silky R&B phrasing with glassy synth textures.", instagram: "@auroravale",
      songs: [["Northern Lights", "Skyline", "RNB", 214, "2019-03-15"], ["Glass Rain", "Skyline", "JAZZ", 242, "2019-03-15"],
              ["Velvet Hours", "Skyline", "POP", 198, "2020-06-05"], ["Paper Moons", "Afterglow", "POP", 205, "2022-09-23"]] },
    { name: "Dusty Boots", email: "dusty@artist.local", gender: "MALE", year: "2009", albums: 5, owner: "manager",
      bio: "Storytelling country songwriter from the dirt roads of the mid-west.", website: "https://dustyboots.example.com",
      songs: [["Long Road Home", "Dust Roads", "COUNTRY", 232, "2012-05-11"], ["Whiskey Sunrise", "Dust Roads", "COUNTRY", 218, "2012-05-11"],
              ["Porch Light", "Fence Posts", "FOLK", 187, "2016-10-07"], ["Rust and Rain", "Fence Posts", "BLUES", 261, "2016-10-07"]] },
    { name: "Maestro K", email: "maestro@artist.local", gender: "OTHER", year: "1998", albums: 8, owner: "user",
      bio: "Composer and conductor bridging orchestral works with arena rock.",
      songs: [["Symphony No. 1", "Opus", "CLASSIC", 1260, "2001-11-02"], ["Electric Fury", "Opus", "ROCK", 301, "2001-11-02"],
              ["Nocturne in Blue", "Quiet Hours", "CLASSIC", 412, "2008-04-18"], ["Iron Lullaby", "Quiet Hours", "ROCK", 276, "2008-04-18"]] },
    { name: "Neon Pulse", email: "neon@artist.local", gender: "MALE", year: "2017", albums: 2, owner: "manager",
      bio: "Electronic duo producing late-night synthwave and club-ready house.", instagram: "@neonpulse",
      songs: [["Midnight Grid", "Voltage", "ELECTRONIC", 276, "2018-02-09"], ["Chrome Hearts", "Voltage", "ELECTRONIC", 249, "2018-02-09"],
              ["Afterhours", "Voltage", "ELECTRONIC", 312, "2021-07-30"], ["Static Bloom", "Signal", "POP", 203, "2023-01-20"]] },
    { name: "Luna Reyes", email: "luna@artist.local", gender: "FEMALE", year: "2013", albums: 4, owner: "manager",
      bio: "Latin-influenced singer-songwriter with an acoustic heart.",
      songs: [["Cielo Abierto", "Raices", "FOLK", 225, "2014-04-04"], ["Marea", "Raices", "POP", 191, "2014-04-04"],
              ["Luz de Luna", "Horizonte", "POP", 208, "2019-08-16"], ["Sal y Sol", "Horizonte", "FOLK", 233, "2019-08-16"]] },
    { name: "MC Fathom", email: "fathom@artist.local", gender: "MALE", year: "2014", albums: 3, owner: "manager",
      bio: "Lyrical hip-hop artist known for dense wordplay and jazz-sampled beats.",
      songs: [["Deep End", "Pressure", "HIPHOP", 207, "2015-09-18"], ["Concrete Poetry", "Pressure", "HIPHOP", 224, "2015-09-18"],
              ["Blue Notes", "Sample Rate", "JAZZ", 258, "2020-03-13"], ["Rewind", "Sample Rate", "HIPHOP", 195, "2020-03-13"]] },
    { name: "Delta Moon", email: "delta@artist.local", gender: "MALE", year: "2005", albums: 6, owner: "user",
      bio: "Slide-guitar bluesman keeping the Delta tradition alive.",
      songs: [["Crossroads Mile", "Mud and Honey", "BLUES", 289, "2007-06-01"], ["Low Water", "Mud and Honey", "BLUES", 254, "2007-06-01"],
              ["Sunday Gravel", "Black Dirt", "ROCK", 238, "2013-10-25"], ["Cotton Moon", "Black Dirt", "BLUES", 271, "2013-10-25"]] },
    { name: "Soleil Park", email: "soleil@artist.local", gender: "FEMALE", year: "2019", albums: 1, owner: "manager",
      bio: "Bedroom-pop newcomer with candy-bright hooks and R&B grooves.",
      songs: [["Sugar Static", "Lemonade Days", "POP", 182, "2020-05-22"], ["Honey Voice", "Lemonade Days", "RNB", 214, "2020-05-22"],
              ["Late Bus Home", "Lemonade Days", "RNB", 227, "2020-05-22"], ["Seventeen Again", "Lemonade Days", "POP", 196, "2021-02-12"]] },
];

// [artist index, title, venue, city, days from now, status, fee]
const GIGS: [number, string, string, string, number, "HOLD" | "CONFIRMED" | "COMPLETED" | "CANCELLED", number][] = [
    [0, "Skyline Release Night", "Moonlight Hall", "Kathmandu", -60, "COMPLETED", 4500],
    [1, "Dust Roads Revival", "Old Barn Stage", "Pokhara", -21, "COMPLETED", 3200],
    [6, "Delta Nights", "Blue Door Bar", "Pokhara", -5, "CANCELLED", 1800],
    [3, "Voltage Club Tour", "Warehouse 9", "Lalitpur", 12, "CONFIRMED", 6000],
    [0, "Afterglow Showcase", "City Auditorium", "Kathmandu", 30, "CONFIRMED", 5200],
    [5, "Pressure Live", "The Basement", "Bhaktapur", 45, "HOLD", 2800],
    [2, "Winter Symphony Gala", "Royal Concert Hall", "Kathmandu", 75, "CONFIRMED", 12000],
];

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to seed the admin user.");
    }
    if (password.length < 8) {
        throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
    }

    const hash = await bcrypt.hash(password, 10);

    // idempotent: re-running updates the same admin
    await prisma.user.upsert({
        where: { email },
        update: { password: hash, role: "ADMIN" },
        create: { name: "Admin", email, password: hash, role: "ADMIN" },
    });

    console.log(`Seeded admin user: ${email}`);

    // Optional demo data (idempotent): set SEED_DEMO_PASSWORD (min 8 chars) to also create
    // manager@artist.local (ARTIST_MANAGER), user@artist.local (USER), sample artists, music,
    // gigs, a playlist and favorites.
    const demoPassword = process.env.SEED_DEMO_PASSWORD;
    if (!demoPassword) return;
    if (demoPassword.length < 8) throw new Error("SEED_DEMO_PASSWORD must be at least 8 characters.");
    const demoHash = await bcrypt.hash(demoPassword, 10);

    const manager = await prisma.user.upsert({
        where: { email: "manager@artist.local" },
        update: { password: demoHash, role: "ARTIST_MANAGER" },
        create: { name: "Demo Manager", email: "manager@artist.local", password: demoHash, role: "ARTIST_MANAGER" },
    });
    const demoUser = await prisma.user.upsert({
        where: { email: "user@artist.local" },
        update: { password: demoHash, role: "USER" },
        create: { name: "Demo User", email: "user@artist.local", password: demoHash, role: "USER" },
    });
    const owners = { manager: manager.id, user: demoUser.id };

    const songIds: string[] = [];
    const artistIds: string[] = [];
    for (const a of ARTISTS) {
        const extra = { bio: a.bio, website: a.website ?? null, instagram: a.instagram ?? null };
        const artist = await prisma.artist.upsert({
            where: { email: a.email },
            update: extra,
            create: {
                name: a.name,
                email: a.email,
                gender: a.gender,
                first_release_year: a.year,
                total_albums: a.albums,
                address: "Kathmandu",
                createdBy: owners[a.owner],
                ...extra,
            },
        });
        artistIds.push(artist.id);
        for (const [title, album, genre, durationSec, releaseDate] of a.songs) {
            const data = { album, genre, durationSec, releaseDate: new Date(`${releaseDate}T00:00:00.000Z`) };
            const exists = await prisma.music.findFirst({ where: { title, artistId: artist.id } });
            const song = exists
                ? await prisma.music.update({ where: { id: exists.id }, data })
                : await prisma.music.create({ data: { title, artistId: artist.id, ...data } });
            songIds.push(song.id);
        }
    }

    // gigs: past and upcoming (re-runs keep them: matched by artist + title)
    const day = 24 * 60 * 60 * 1000;
    for (const [idx, title, venue, city, offset, status, fee] of GIGS) {
        const artistId = artistIds[idx];
        const exists = await prisma.gig.findFirst({ where: { artistId, title } });
        if (exists) continue;
        const date = new Date(Date.now() + offset * day);
        date.setUTCHours(14, 0, 0, 0);
        await prisma.gig.create({ data: { artistId, title, venue, city, date, status, fee, createdBy: manager.id } });
    }

    // one playlist and a few favorites for the manager (idempotent)
    const existingPlaylist = await prisma.playlist.findFirst({ where: { ownerId: manager.id, name: "Late Night Drive" } });
    if (!existingPlaylist) {
        await prisma.playlist.create({
            data: {
                name: "Late Night Drive",
                description: "Smooth tracks for the road after dark.",
                ownerId: manager.id,
                items: { create: [0, 1, 8, 12, 16, 20].map((i, position) => ({ musicId: songIds[i], position })) },
            },
        });
    }
    const favorites: ["ARTIST" | "SONG", string][] = [
        ["ARTIST", artistIds[0]],
        ["ARTIST", artistIds[3]],
        ["SONG", songIds[0]],
        ["SONG", songIds[12]],
    ];
    for (const [targetType, targetId] of favorites) {
        await prisma.favorite.upsert({
            where: { userId_targetType_targetId: { userId: manager.id, targetType, targetId } },
            update: {},
            create: { userId: manager.id, targetType, targetId },
        });
    }

    console.log("Seeded demo manager, user, artists, music, gigs, playlist and favorites");
}

main()
    .catch((e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

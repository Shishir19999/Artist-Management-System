import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcrypt";

const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(process.env.DATABASE_URL as string),
});

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
    // manager@artist.local (ARTIST_MANAGER), user@artist.local (USER), sample artists and music.
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

    const artists = [
        { name: "Aurora Vale", email: "aurora@artist.local", gender: "FEMALE" as const, year: "2015", albums: 3, owner: manager.id,
          songs: [["Northern Lights", "Skyline", "RNB"], ["Glass Rain", "Skyline", "JAZZ"]] },
        { name: "Dusty Boots", email: "dusty@artist.local", gender: "MALE" as const, year: "2009", albums: 5, owner: manager.id,
          songs: [["Long Road Home", "Dust Roads", "COUNTRY"], ["Whiskey Sunrise", "Dust Roads", "COUNTRY"]] },
        { name: "Maestro K", email: "maestro@artist.local", gender: "OTHER" as const, year: "1998", albums: 8, owner: demoUser.id,
          songs: [["Symphony No. 1", "Opus", "CLASSIC"], ["Electric Fury", "Opus", "ROCK"]] },
    ];
    for (const a of artists) {
        const artist = await prisma.artist.upsert({
            where: { email: a.email },
            update: {},
            create: { name: a.name, email: a.email, gender: a.gender, first_release_year: a.year, total_albums: a.albums, address: "Kathmandu", createdBy: a.owner },
        });
        for (const [title, album, genre] of a.songs) {
            const exists = await prisma.music.findFirst({ where: { title, artistId: artist.id } });
            if (!exists) await prisma.music.create({ data: { title, album, genre: genre as "RNB" | "JAZZ" | "COUNTRY" | "CLASSIC" | "ROCK", artistId: artist.id } });
        }
    }
    console.log("Seeded demo manager, user, artists and music");
}

main()
    .catch((e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

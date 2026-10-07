import type { GigDTO, PlaylistDTO } from "./types";

type GigRow = {
    id: string;
    artistId: string;
    title: string;
    venue: string;
    city: string | null;
    date: Date;
    status: GigDTO["status"];
    fee: number | null;
    notes: string | null;
    createdBy: string | null;
    created_at: Date;
};

export function toGigDTO(g: GigRow): GigDTO {
    return {
        id: g.id,
        artistId: g.artistId,
        title: g.title,
        venue: g.venue,
        city: g.city ?? null,
        date: g.date.toISOString(),
        status: g.status,
        fee: g.fee ?? null,
        notes: g.notes ?? null,
        createdBy: g.createdBy ?? null,
        created_at: g.created_at.toISOString(),
    };
}

type PlaylistRow = {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    created_at: Date;
    updated_at: Date;
    items: { musicId: string; position: number }[];
};

export function toPlaylistDTO(p: PlaylistRow): PlaylistDTO {
    return {
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        ownerId: p.ownerId,
        songIds: [...p.items].sort((a, b) => a.position - b.position).map((i) => i.musicId),
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
    };
}

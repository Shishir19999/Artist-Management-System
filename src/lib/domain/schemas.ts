import z from "zod";
import { GENRES, GENDERS, GIG_STATUSES } from "./constants";

/** Empty string / null clear an optional text field, undefined leaves it unchanged. */
export function cleanOpt<T>(v: T | null | undefined | ""): T | null | undefined {
    if (v === undefined) return undefined;
    return v === null || v === "" ? null : v;
}

const optText = (max: number) => z.string().max(max).nullish();

/** Small raster/vector image encoded as a data URL (uploads are resized in the browser first). */
export const dataImage = z
    .string()
    .max(150_000, "Image is too large")
    .regex(/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/, "Invalid image")
    .nullish();

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const artistExtraFields = {
    bio: optText(2000),
    photo: dataImage,
    website: optText(200),
    instagram: optText(100),
    youtube: optText(200),
    spotify: optText(200),
};

export const musicExtraFields = {
    durationSec: z.number().int().min(1, "Minimum 1 second").max(7200, "Maximum 2 hours").nullish(),
    releaseDate: z
        .string()
        .regex(ISO_DATE, "Use YYYY-MM-DD")
        .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date")
        .nullish(),
    coverUrl: dataImage,
};

export const GigSchema = z.object({
    artistId: z.string().min(1, "Artist is required"),
    title: z.string().trim().min(1, "Title is required").max(120),
    venue: z.string().trim().min(1, "Venue is required").max(120),
    city: optText(80),
    date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date"),
    status: z.enum(GIG_STATUSES).default("CONFIRMED"),
    fee: z.number().int().min(0).max(100_000_000).nullish(),
    notes: optText(500),
});

export const PlaylistSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(80),
    description: optText(300),
    songIds: z.array(z.string()).max(500).default([]),
});

export const FavoriteSchema = z.object({
    targetType: z.enum(["ARTIST", "SONG"]),
    targetId: z.string().min(1),
});

export const ProfileSchema = z
    .object({
        name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
        gender: z.enum(GENDERS).optional(),
        phone: z.string().trim().max(30).nullish(),
        address: z.string().trim().max(190).nullish(),
        birthDate: z.string().regex(ISO_DATE, "Birth date must be YYYY-MM-DD").nullish(),
        image: dataImage,
        currentPassword: z.string().max(72).optional(),
        newPassword: z.string().min(8, "Password must be at least 8 characters").max(72).optional(),
    })
    .refine((v) => !v.newPassword || !!v.currentPassword, {
        message: "Enter your current password to set a new one",
        path: ["currentPassword"],
    });

export const GenreEnum = z.enum(GENRES);

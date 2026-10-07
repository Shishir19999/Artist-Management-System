"use client";
import axios from "axios";
import { useState } from "react";
import { LuHeart } from "react-icons/lu";
import { useFavorites } from "@/lib/client/hooks";
import { invalidate } from "@/lib/client/use-api";
import { showError } from "@/utils/notify";
import type { FavoriteDTO } from "@/lib/domain/types";

export default function FavoriteButton({
    type,
    id,
    name,
    size = "sm",
}: {
    type: FavoriteDTO["targetType"];
    id: string;
    name: string;
    size?: "xs" | "sm" | "md";
}) {
    const { isFavorite } = useFavorites();
    const [busy, setBusy] = useState(false);
    const on = isFavorite(type, id);

    const toggle = async () => {
        setBusy(true);
        try {
            await axios.post("/api/favorites", { targetType: type, targetId: id });
            invalidate("/api/favorites");
        } catch (e) {
            showError(e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            className={`btn btn-ghost btn-circle btn-${size}`}
            aria-pressed={on}
            aria-label={`${on ? "Remove" : "Add"} ${name} ${on ? "from" : "to"} favorites`}
            disabled={busy}
            onClick={toggle}
        >
            <LuHeart aria-hidden className={on ? "fill-current text-error" : ""} />
        </button>
    );
}

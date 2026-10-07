"use client";
import { useParams, useSearchParams } from "next/navigation";
import { IS_DEMO } from "./mode";

/** Detail pages: /admin/artist/show/[artist_id] in the real build, /admin/artist/show/?id= in the static demo. */
export function useEntityId(param: string): string | null {
    const params = useParams();
    const search = useSearchParams();
    if (IS_DEMO) return search.get("id");
    const v = params?.[param];
    return typeof v === "string" ? v : null;
}

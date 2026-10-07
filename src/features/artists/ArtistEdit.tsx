"use client";
import NotAvailable from "@/components/shell/NotAvailable";
import { BackLink, LoadState } from "@/components/ui/DetailGate";
import { PageHeader } from "@/components/ui/States";
import { useAuth } from "@/lib/client/auth";
import { canEditArtist } from "@/lib/client/role-policy";
import { routes } from "@/lib/client/routes";
import { useApi } from "@/lib/client/use-api";
import type { ArtistDTO } from "@/lib/domain/types";
import ArtistForm from "./ArtistForm";

export default function ArtistEdit({ id }: { id: string }) {
    const { user } = useAuth();
    const req = useApi<{ artist: ArtistDTO }>(`/api/artists/${id}`);
    const artist = req.data?.artist;
    if (!artist) return <LoadState loading={req.loading} error={req.error ?? "Artist not found"} onRetry={req.reload} notFound="This artist does not exist." />;
    if (user && !canEditArtist(user, artist)) return <NotAvailable role={user.role} />;
    return (
        <>
            <PageHeader back={<BackLink href={routes.artistShow(id)}>Back to profile</BackLink>} title={`Edit ${artist.name}`} />
            <ArtistForm key={artist.updated_at} artist={artist} />
        </>
    );
}

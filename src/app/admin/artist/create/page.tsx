import { BackLink } from "@/components/ui/DetailGate";
import { PageHeader } from "@/components/ui/States";
import ArtistForm from "@/features/artists/ArtistForm";
import { routes } from "@/lib/client/routes";

export const metadata = { title: "New artist" };

export default function CreateArtistPage() {
  return (
    <>
      <PageHeader back={<BackLink href={routes.artists}>All artists</BackLink>} title="New artist" />
      <ArtistForm />
    </>
  );
}

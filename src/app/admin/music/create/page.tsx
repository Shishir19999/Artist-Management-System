import { BackLink } from "@/components/ui/DetailGate";
import { PageHeader } from "@/components/ui/States";
import SongForm from "@/features/music/SongForm";
import { routes } from "@/lib/client/routes";

export const metadata = { title: "New song" };

export default function CreateMusicPage() {
  return (
    <>
      <PageHeader back={<BackLink href={routes.music}>All songs</BackLink>} title="New song" />
      <SongForm />
    </>
  );
}

import { Suspense } from "react";
import PlaylistsPage from "@/features/playlists/PlaylistsPage";
import { SkeletonRows } from "@/components/ui/States";

export const metadata = { title: "Playlists" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonRows rows={4} />}>
      <PlaylistsPage />
    </Suspense>
  );
}

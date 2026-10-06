import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import UserCard from './partials/UserCard';
import MusicCard from './partials/MusicCard';
import ArtistCard from './partials/ArtistCard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // proxy guarantees a session; role decides which cards render
  const session = await getServerSession(authOptions);
  const role = session?.user.role;

  return (
    <div className="grid grid-cols-12 gap-[30px]">
      {role === 'ADMIN' && (
        <>
          <div className="col-span-4"><UserCard /></div>
          <div className="col-span-4"><MusicCard /></div>
          <div className="col-span-4"><ArtistCard /></div>
        </>
      )}

      {role === 'ARTIST_MANAGER' && (
        <>
          <div className="col-span-6"><ArtistCard /></div>
          <div className="col-span-6"><MusicCard /></div>
        </>
      )}

      {role === 'USER' && (
        <div className="col-span-12"><MusicCard /></div>
      )}
    </div>
  );
}

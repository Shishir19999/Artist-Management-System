// import React from 'react';
// import { useSession } from 'next-auth/react';
// import UserCard from './partials/UserCard';
// import MusicCard from './partials/MusicCard';
// import ArtistCard from './partials/ArtistCard';

// export default function DashboardPage() {
//   const { data: session, status } = useSession(); 

//   if (status === 'loading') {
//     return <div>Loading...</div>; 
//   }

//   if (!session) {
//     return <div>You must be logged in to view this page.</div>; 
//   }

//   // const { role } = session.user;

//   return (
//     <div className="grid grid-cols-12 gap-[30px]">
//       {/* Render cards based on user role */}
//       {role === 'ADMIN' && (
//         <>
//           <div className="col-span-4">
//             <UserCard />
//           </div>
//           <div className="col-span-4">
//             <MusicCard />
//           </div>
//           <div className="col-span-4">
//             <ArtistCard />
//           </div>
//         </>
//       )}

//       {role === 'ARTIST_MANAGER' && (
//         <>
//           <div className="col-span-6">
//             <ArtistCard />
//           </div>
//           <div className="col-span-6">
//             <MusicCard />
//           </div>
//         </>
//       )}

//       {role === 'USER' && (
//         <div className="col-span-12">
//           <MusicCard />
//         </div>
//       )}
//     </div>
//   );
// }

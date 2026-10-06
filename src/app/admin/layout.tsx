import AdminHeader from '@/components/AdminHeader'
import AdminSidebar from '@/components/AdminSideBar'
import React, { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'

export default async function AdminLayout({ children}: { children: ReactNode}) {
  const session = await getServerSession(authOptions);
  // revoked / deleted-user tokens (empty id, see jwt callback) must not see admin pages
  if (!session?.user?.id) redirect('/auth/login');
  const role = session?.user?.role ?? 'USER';
  const label = session?.user?.name || session?.user?.email || 'Account';
  return (
    <div className='relative w-screen h-screen'>
        <div className='w-[270px] bg-theme-sidebar absolute h-full'>
            <AdminSidebar role={role}/>
        </div>
        <div className='absolute w-[calc(100%-270px)] left-[270px]  h-[50px]'>
            <AdminHeader label={label} role={role}/>
        </div>
        <main className='p-[50px] absolute top-[50px] w-[calc(100%-270px)] left-[270px] text-black bg-slate-200 h-[calc(100%-50px)]'>
            { children}
        </main>
    </div>
  )
}

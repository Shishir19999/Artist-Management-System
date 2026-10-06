"use client";
import React, { useRef } from 'react';
import { useHoverDirty } from 'react-use';
import { FaRegUser } from "react-icons/fa";
import { FaBarsStaggered } from "react-icons/fa6";
import { CiLogout } from "react-icons/ci";
import { signOut } from 'next-auth/react';

export default function AdminHeader({ label, role }: { label: string; role: string }) {
  const ref = useRef<HTMLDivElement>(null!) // react-use types want a non-null RefObject;
  const isHovering = useHoverDirty(ref);

  const handleLogout = () =>{
    signOut({ callbackUrl: "/auth/login" });
  }

  return (
    <div className=' h-[50px] flex justify-between items-center px-[30px]'>
      <div>
      <FaBarsStaggered />
      </div>

      <div ref={ref} className='relative flex gap-3 items-center h-[50px]'>
        <FaRegUser/>
        <span>{label} ({role})</span>

        {
          isHovering && 
            <div className='absolute right-0 top-full bg-black w-[200px] p-[15px] rounded-lg items-center gap-3 flex z-999'>
              <button onClick={handleLogout} className='flex items-center gap-2'>
                <CiLogout />
                <span>Logout</span>
              </button>
            </div>
      }

      </div>
     
    </div>
  )
}
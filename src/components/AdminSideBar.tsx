"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { FaRegUser, FaMusic,FaGuitar } from "react-icons/fa";

type Role = "USER" | "ARTIST_MANAGER" | "ADMIN";

export default function AdminSidebar({ role }: { role: Role }) {
  const currentPath = usePathname();

  const navLinks = [
    { href: "/admin/artist", label: "Artist", icon: <FaGuitar />, roles: ["ADMIN", "ARTIST_MANAGER", "USER"] },
    { href: "/admin/music", label: "Music", icon: <FaMusic />, roles: ["ADMIN", "ARTIST_MANAGER", "USER"] },
    { href: "/admin/user", label: "User", icon: <FaRegUser />, roles: ["ADMIN"] }
  ].filter(link => link.roles.includes(role)) // hide links the role cannot open

  return (
    <div className='px-[30px] pt-[200px]'>
      <ul>
        {
          navLinks.map(link=> <li key={link.href}>
            <Link
            href={link.href}
            className={`text-white flex items-center gap-3 py-[10px] px-[50px] border border-[#fff] rounded-[10px] hover:bg-blue-400 ${currentPath.startsWith(link.href) ? 'bg-blue-400': ''}`}>
              {link.icon}
              <span>{link.label}</span>
            </Link>
          </li>)
        }       

      </ul>
    </div>
  )
}
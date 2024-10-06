import Link from 'next/link'
import React, { ReactNode } from 'react'

interface Props{
    isLoading: boolean
    title: string,
    counter: number,
    icon: ReactNode,
    href: string,
    color: string
}

export default function DashboardPanelCard({isLoading, title, counter,color, icon, href }: Props) {
  return (
    <div className='flex justify-between border-2 border-slate-300 p-[30px] rounded-[15px] shadow-[0_8px_30px_rgb(0,0,0,0.12)]'>
        <div className='flex flex-col'>
            <h4 className='text-[24px] font-bold text-black'>{title}</h4>
            {
              isLoading
              ? <>Loading....</>
              :<span className='text-[24px] font-bold my-5' style={{ color: color }}>{counter}</span>
            }
            <Link href={href} className='px-5 py-3 rounded-[5px] text-white' style={{ backgroundColor: color }}>View Details</Link>
        </div>
        <div>
            <div className='w-[50px] h-[50px] rounded-full flex justify-center items-center text-white' style={{ backgroundColor: color }}>{icon}</div>
        </div>

    </div>
  )
}
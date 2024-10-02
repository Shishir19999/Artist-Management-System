"use client"; 

import GoToBack from '@/components/GoToBack';
import React from 'react';
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IoMdEye } from "react-icons/io";

export default function MusicList() {
  const musicTracks = [
    {
      id: 1,
      title: "Blinding Lights",
      album: "After Hours",
      genre: "Synthwave",
    },
    {
      id: 2,
      title: "Levitating",
      album: "Future Nostalgia",
      genre: "Pop",
    },
    {
      id: 3,
      title: "Save Your Tears",
      album: "After Hours",
      genre: "Synth-pop",
    },
    {
      id: 4,
      title: "Peaches",
      album: "Justice",
      genre: "R&B",
    },
    {
      id: 5,
      title: "Kiss Me More",
      album: "Planet Her",
      genre: "Pop",
    },
  ];

  return (
    <div>
      <GoToBack />
      <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold mb-4">Music List</h1>
      <button className="btn btn-success text-white mb-[4px]">
          Create Music
        </button>
        </div>
      <table className='table table-bordered mb-4 border-b pb-3'>
        <thead>
          <tr className='text-[20px] bg-black text-white'>
            <th className="w-[5%]">SN</th>
            <th className="w-[15%]">Title</th>
            <th className="w-[20%]">Album</th>
            <th className="w-[15%]">Genre</th>
            <th className="w-[7%]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {musicTracks.length > 0 ? (
            musicTracks.map((track, index) => (
              <tr key={track.id}>
                <td>{index + 1}</td>
                <td>{track.title}</td>
                <td>{track.album}</td>
                <td>{track.genre}</td>
                <td className="flex space-x-2">
                  <button className="bg-blue-500 py-2 px-4 text-white rounded-lg">
                    <IoMdEye />
                  </button>
                  <button className="bg-green-500 py-2 px-4 text-white rounded-lg">
                    <FaEdit />
                  </button>
                  <button className="bg-red-500 py-2 px-4 text-white rounded-lg">
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center">No music tracks found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

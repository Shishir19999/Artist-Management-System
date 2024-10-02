"use client"; 

import GoToBack from '@/components/GoToBack';
import React from 'react';
import { FaEdit,FaMusic } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IoMdEye } from "react-icons/io";

export default function ArtistList() {
  const artists = [
    {
      id: 1,
      name: "The Weeknd",
      firstReleaseYear: 2013,
      albumsReleased: 4,
      address: "Toronto, Canada",
      gender: "Male",
      dateOfBirth: "1990-02-16",
    },
    {
      id: 2,
      name: "Dua Lipa",
      firstReleaseYear: 2017,
      albumsReleased: 2,
      address: "London, England",
      gender: "Female",
      dateOfBirth: "1995-08-22",
    },
    {
      id: 3,
      name: "Drake",
      firstReleaseYear: 2009,
      albumsReleased: 6,
      address: "Toronto, Canada",
      gender: "Male",
      dateOfBirth: "1986-10-24",
    },
    {
      id: 4,
      name: "Billie Eilish",
      firstReleaseYear: 2017,
      albumsReleased: 2,
      address: "Los Angeles, USA",
      gender: "Female",
      dateOfBirth: "2001-12-18",
    },
    {
      id: 5,
      name: "Ed Sheeran",
      firstReleaseYear: 2011,
      albumsReleased: 5,
      address: "Halifax, England",
      gender: "Male",
      dateOfBirth: "1991-02-17",
    },
  ];

  return (
    <div>
      <GoToBack />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Artist List</h1>
        <div className="flex gap-1">

        <button className="btn btn-primary text-white mb-[4px]">
          Import CSV
        </button>
        <button className="btn btn-secondary text-white mb-[4px]">
          Export CSV
        </button>
        <button className="btn btn-success text-white mb-[4px]">
          Create Artist
        </button>
        </div>
        
      </div>
      <table className='table table-bordered mb-4 border-b pb-3'>
        <thead>
          <tr className='text-[17px] bg-black text-white'>
            <th className="w-[5%]">SN</th>
            <th className="w-[20%]">Name</th>
            <th className="w-[15%]">First Release Year</th>
            <th className="w-[15%]">No of Albums Released</th>
            <th className="w-[25%]">Address</th>
            <th className="w-[10%]">Gender</th>
            <th className="w-[10%]">Date of Birth</th>
            <th className="w-[10%]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {artists.length > 0 ? (
            artists.map((artist, index) => (
              <tr key={artist.id}>
                <td>{index + 1}</td>
                <td>{artist.name}</td>
                <td>{artist.firstReleaseYear}</td>
                <td>{artist.albumsReleased}</td>
                <td>{artist.address}</td>
                <td>{artist.gender}</td>
                <td>{artist.dateOfBirth}</td>
                <td className="flex space-x-2">
                  <button className="bg-purple-500 py-2 px-4 text-white rounded-lg">
                  <FaMusic /> 
                  </button>
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
              <td colSpan={8} className="text-center">No artists found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

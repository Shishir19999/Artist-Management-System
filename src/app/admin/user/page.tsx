"use client"; 

import GoToBack from '@/components/GoToBack';
import React from 'react';
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IoMdEye } from "react-icons/io";

export default function UsersList() {
  const users = [
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "123-456-7890",
      address: "123 Main St, Springfield, IL",
      gender: "Male",
      role: "Admin",
      dateOfBirth: "1990-01-01",
    },
    {
      id: 2,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      phone: "234-567-8901",
      address: "456 Elm St, Springfield, IL",
      gender: "Female",
      role: "User",
      dateOfBirth: "1992-02-02",
    },
    {
      id: 3,
      firstName: "Emily",
      lastName: "Jones",
      email: "emily.jones@example.com",
      phone: "345-678-9012",
      address: "789 Oak St, Springfield, IL",
      gender: "Female",
      role: "Moderator",
      dateOfBirth: "1989-03-03",
    },
    {
      id: 4,
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.brown@example.com",
      phone: "456-789-0123",
      address: "321 Pine St, Springfield, IL",
      gender: "Male",
      role: "Admin",
      dateOfBirth: "1985-04-04",
    },
    {
      id: 5,
      firstName: "Sarah",
      lastName: "Davis",
      email: "sarah.davis@example.com",
      phone: "567-890-1234",
      address: "654 Cedar St, Springfield, IL",
      gender: "Female",
      role: "User",
      dateOfBirth: "1995-05-05",
    },
  ];

  return (
    <div>
      <GoToBack />
      <h1 className="text-2xl font-bold mb-4">Users List</h1>
      <table className='table-auto w-full'>
        <thead>
          <tr className='text-[15px] bg-black text-white'>
            <th className="w-[5%]">SN</th>
            <th className="w-[15%]">First Name</th>
            <th className="w-[15%]">Last Name</th>
            <th className="w-[20%]">Email</th>
            <th className="w-[15%]">Phone</th>
            <th className="w-[27%]">Address</th>
            <th className="w-[10%]">Gender</th>
            <th className="w-[13%]">Role</th>
            <th className="w-[15%]">Date of Birth</th>
            <th className="w-[15%]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.address}</td>
                <td>{user.gender}</td>
                <td>{user.role}</td>
                <td>{user.dateOfBirth}</td>
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
              <td colSpan={10} className="text-center">No users found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

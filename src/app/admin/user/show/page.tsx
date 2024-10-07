"use client"
import GoToBack from '@/components/GoToBack';
import axios from 'axios';
import React, { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { showError } from '@/utils/notify';

interface User {
  id: number;
  name: string;
  email: string;
  profile_image: string;
  gender: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export default function ShowUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  

  const fetchUserData = () => {
    

    setLoading(true);
    setError(null);

    axios.get(`http://localhost:3000/api/users/${user_id}`)
      .then(res => {
        setUser(res.data.user);
      })
      .catch(err => {
        setError('Failed to fetch user details.');
        showError('Failed to fetch user details.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffectOnce(() => {
    fetchUserData();
  });

  return (
    <div>
      <GoToBack />
      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : user ? (
        <div className="card w-96 bg-base-100 shadow-xl mx-auto mt-10">
          <figure>
            {user.profile_image && (
              <img src={user.profile_image} alt={user.name} className="w-full h-auto" />
            )}
          </figure>
          <div className="card-body">
            <h2 className="card-title">{user.name}</h2>
            <p>Email: {user.email}</p>
            <p>Gender: {user.gender}</p>
            <p>Role: {user.role}</p>
            <p>Created At: {new Date(user.created_at).toLocaleString()}</p>
            <p>Updated At: {new Date(user.updated_at).toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <div className="text-center">User not found.</div>
      )}
    </div>
  );
}

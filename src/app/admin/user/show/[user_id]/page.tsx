"use client";
import { baseUrl } from '@/utils/baseURL';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { showError } from "@/utils/notify";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
    params: {
        user_id: string;
    }
}

interface Artist {
    id: number; 
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    profile_image: string;
    gender: string;
    role: string;
    created_at: Date;
    updated_at: Date;
    Artist?: Artist[]; 
}

export default function ShowUser({ params: { user_id } }: Props) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null); // Start as null
    const [loading, setLoading] = useState(true); // Loading state

    const fetchUserById = async () => {
        try {
            const response = await axios.get(`${baseUrl.local}/users/${user_id}`);
            setUser(response.data.user);
        } catch (err) {
            showError(err);
        } finally {
            setLoading(false); // End loading regardless of success or error
        }
    };

    useEffect(() => {
        fetchUserById();
    }, [user_id]);

    if (loading) {
        return <div>Loading user details...</div>; // Loading message
    }

    if (!user) {
        return <div>User not found.</div>; // Handle case where user is not found
    }

    return (
        <div>
            <h1 className='mb-[30px] pb-2 border-b-2 text-[30px] font-bold'>User Details</h1>
            <table className='table table-caption'>
                <thead>
                    <tr>
                        <th>Name</th>
                        <td>{user.name}</td>
                    </tr>
                    <tr>
                        <th>Email</th>
                        <td>{user.email}</td>
                    </tr>
                    <tr>
                        <th>Gender</th>
                        <td>{user.gender}</td>
                    </tr>
                    <tr>
                        <th>Role</th>
                        <td>{user.role}</td>
                    </tr>
                    <tr>
                        <th>Artists</th>
                        <td>
                            <ul>
                                {user.Artist && user.Artist.length > 0 ? (
                                    user.Artist.map((artist) => (
                                        <li key={artist.id}>{artist.name}</li>
                                    ))
                                ) : (
                                    <li>No artists available.</li> 
                                )}
                            </ul>
                        </td>
                    </tr>
                </thead>
            </table>
            <Link href={`/admin/user/edit/${user.id}`} className='btn btn-primary'>Edit User</Link>
        </div>
    );
}

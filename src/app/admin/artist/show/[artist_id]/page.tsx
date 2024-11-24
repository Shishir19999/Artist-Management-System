"use client";
import { baseUrl } from '@/utils/baseURL';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { showError } from "@/utils/notify";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
    params: {
        artist_id: string;
    }
}

interface Music {
    id: number; 
    title: string
}

interface Artist{
    id :number;
    name:string;
    email:string;
    profile_image:string;
    gender:string;
    address:string;
    total_albums:number;
    created_at:Date;
    updated_at:Date;
    music?: Music
}

export default function ShowArtist({ params: { artist_id } }: Props) {
    const router = useRouter();
    const [artist, setArtist] = useState<Artist | null>(null); // Start as null
    const [loading, setLoading] = useState(true); // Loading state

    const fetchArtistById = async () => {
        try {
            const response = await axios.get(`${baseUrl.local}/artists/${artist_id}`);
            setArtist(response.data.artist);
        } catch (err) {
            showError(err);
        } finally {
            setLoading(false); // End loading regardless of success or error
        }
    };

    useEffect(() => {
        fetchArtistById();
    }, [artist_id]);

    if (loading) {
        return <div>Loading artist details...</div>; // Loading message
    }

    if (!artist) {
        return <div>artist not found.</div>; // Handle case where artist is not found
    }

    return (
        <div>
            <h1 className='mb-[30px] pb-2 border-b-2 text-[30px] font-bold'>artist Details</h1>
            <table className='table table-caption'>
                <thead>
                    <tr>
                        <th>Name</th>
                        <td>{artist.name}</td>
                    </tr>
                    <tr>
                        <th>Email</th>
                        <td>{artist.email}</td>
                    </tr>
                    <tr>
                        <th>Gender</th>
                        <td>{artist.gender}</td>
                    </tr>
                    <tr>
                        <th>Gender</th>
                        <td>{artist.address}</td>
                    </tr>
                    <tr>
                        <th>Gender</th>
                        <td>{artist.total_albums}</td>
                    </tr>
                    
                    <tr>
                        <th>Musics</th>
                        <td>
                            <ul>
                            {artist.music ? artist.music.title : 'No music assigned'}

                            </ul>
                        </td>
                    </tr>
                </thead>
            </table>
            <Link href={`/admin/artist/edit/${artist.id}`} className='btn btn-primary'>Edit Artist</Link>
        </div>
    );
}

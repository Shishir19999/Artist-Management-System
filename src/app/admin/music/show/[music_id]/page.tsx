"use client";
import { baseUrl } from '@/utils/baseURL';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { showError } from "@/utils/notify";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
    params: {
        music_id: string;
    }
}

enum Genre{
    RNB = "RNB",
    COUNTRY = "COUNTRY",
    CLASSIC = "CLASSIC",
    ROCK="ROCK",
    JAZZ="JAZZ"
}
interface Artist {
    id: string; 
    name: string
}
interface Music{
    id: string,
    title:string,
    album:string,
    genre: Genre,
    artistId: string;
    artist?: Artist
}

export default function ShowMusic({ params: { music_id } }: Props) {
    const router = useRouter();
    const [music, setMusic] = useState<Music | null>(null); // Start as null
    const [loading, setLoading] = useState(true); // Loading state

    const fetchMusicById = async () => {
        try {
            const response = await axios.get(`${baseUrl.local}/musics/${music_id}`);
            setMusic(response.data.music);
        } catch (err) {
            showError(err);
        } finally {
            setLoading(false); // End loading regardless of success or error
        }
    };

    useEffect(() => {
        fetchMusicById();
    }, [music_id]);

    if (loading) {
        return <div>Loading Music details...</div>; // Loading message
    }

    if (!music) {
        return <div>Music not found.</div>; // Handle case where artist is not found
    }

    return (
        <div>
            <h1 className='mb-[30px] pb-2 border-b-2 text-[30px] font-bold'>Music Details</h1>
            <table className='table table-caption'>
                <thead>
                    <tr>
                        <th>Title</th>
                        <td>{music.title}</td>
                    </tr>
                    <tr>
                        <th>Email</th>
                        <td>{music.album}</td>
                    </tr>
                    <tr>
                        <th>Gender</th>
                        <td>{music.genre}</td>
                    </tr>
                    <tr>
                        <th>Artist</th>
                        <td>
                            <ul>
                            {music.artist ? music.artist.name : 'No artist assigned'}

                            </ul>
                        </td>
                    </tr>
                </thead>
            </table>
            <Link href={`/admin/edit/${music.id}`} className='btn btn-primary'>Edit Music</Link>
        </div>
    );
}

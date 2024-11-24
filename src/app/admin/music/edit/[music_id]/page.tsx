"use client"
import { baseUrl } from '@/utils/baseURL';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { showError, showSucces } from "@/utils/notify"
import { handleError } from '@/utils/errorsHandle';
import { useRouter } from 'next/navigation';

type Artist = {
    id: string;
    name: string;
};
interface Props{
    params: {
        music_id: string
    }
}
export default function EditMusic({ params: { music_id} }: Props) {
    const router = useRouter();
    const [artists,setArtists] = useState<Artist[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        album: "",
        genre: "",
        artistId: "",

    });
    useEffect(() => {
        axios.get(`${baseUrl.local}/artists`)
            .then(res => {
                setArtists(res.data.artists);
            })
            .catch(err => {
                showError(handleError(err));
            });
    }, []);
    
    const fetchMusicById = () =>{
        axios.get(`${baseUrl.local}/musics/${music_id}`)
        .then(res =>{
            const music = res.data.music;
            setFormData({
                ...res.data.music,
                artistId: res.data.music.artistId || ""
            })
        })
        .catch(err=>{
            showError(err);
        })
    }

    const handleChange = (e:any) =>{
        setFormData({ ...formData, [e.target.name]: e.target.value})
    }

    const editMusic = (e:any) =>{
        e.preventDefault();

        axios.put(`${baseUrl.local}/musics/${music_id}`, formData )
        .then(res =>{

            
            showSucces("Music updated susccessfull!");

            router.push('/admin/music');

        })
        .catch(err=>{
            showError(handleError(err))
        });

        // clear form
        setFormData({
            title: "",
            album: "",
            genre: "",
            artistId: "",
        })
    }

    useEffect(()=>{
        fetchMusicById();
    },[])

  return (
    <div >
            <h1 className='mb-[30px] pb-2 border-b-2 text-[30px] font-bold'>Edit Music</h1>
            <form onSubmit={editMusic}>
                <div className='grid grid-cols-2 gap-[30px]'>
                    <div className='col-span-1'>
                        <label htmlFor="titleField">Music</label>
                        <input type="text" name='title' onChange={handleChange} value={formData.title} id='titleField' className='w-full py-3 px-5 border border-[#666]' placeholder='Enter Title' />
                    </div>
                    <div className='col-span-1'>
                        <label htmlFor="albumField">Album</label>
                        <input type="text" name='album' onChange={handleChange} value={formData.album} id='albumField' className='w-full py-3 px-5 border border-[#666]' placeholder='Enter album' />
                    </div>
                    <div className='col-span-1'>
                        <label htmlFor="artistField">Select Artist</label>
                        <select
                            name='artistId'
                            onChange={handleChange}
                            value={formData.artistId || ""}
                            id='artistField'
                            className='w-full py-3 px-5 border border-[#666]'
                        >
                            <option value="">Select Artist</option>
                            {artists.map(artist => (
                                <option key={artist.id} value={artist.id}>
                                    {artist.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='col-span-1'>
                        <label htmlFor="genreField">Genre</label>
                        <select name="genre" id="genreField" onChange={handleChange} value={formData.genre} className='w-full py-3 px-5 border border-[#666]'>
                            <option value="">Select Genre</option>
                            <option value="RNB">RNB</option>
                            <option value="COUNTRY">COUNTRY</option>
                            <option value="CLASSIC">CLASSIC</option>
                            <option value="ROCK">ROCK</option>
                            <option value="JAZZ">JAZZ</option>
                        </select>
                    </div>


                    <div className='col-span-2'>
                        <button type='submit' className='btn btn-success text-white'>Edit Music</button>
                    </div>
                </div>
            </form>
        </div>
    )
}
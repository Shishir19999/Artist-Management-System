"use client"
import GoToBack from "@/components/GoToBack"
import axios from "axios"
import React,{useState} from "react"
import { useEffectOnce } from "react-use"
import { showError,showSucces } from "@/utils/notify"
import Link from "next/link"
import { FaEdit } from 'react-icons/fa';
import { IoEyeSharp } from 'react-icons/io5';
import { MdDelete } from 'react-icons/md';

enum Genre{
    RNB = "RNB",
    COUNTRY = "COUNTRY",
    CLASSIC = "CLASSIC",
    ROCK="ROCK",
    JAZZ="JAZZ"
}
interface Music{
    id: number,
    title:string,
    album:string,
    genre: Genre,
}

export default function ShowMusics(){
    const [musics, setMusics] = useState<Music[]>([]);
    const [isLoading, setLoading] = useState(false);
    const fetchMusicsData=()=>{
        setLoading(true);
        axios.get('http://localhost:3000/api/musics')
        .then(res=>{
            setMusics(res.data.musics);
            setLoading(false);
        })
        .catch(err=>{
            setLoading(false);
        })
    }
    useEffectOnce(() => {
        fetchMusicsData();
    })
    const handleDelete = (id:number) => {
      axios.delete(`http://localhost:3000/api/musics/${id}`)
      .then(res =>{
  
        showSucces("Music Deleted Successfull!");
  
        fetchMusicsData();
  
      })
      .catch((err:any) =>{
        console.log(err);
        showError(err);
      })
    }

    return (
        <div>
        <GoToBack/>
        <div className='flex justify-between items-center'>
        <h1>Musics List</h1>
        <Link href="/admin/music/create" className='btn btn-success'>Create Music</Link>
        </div>
        <table className='table table-zebra'>
          <thead>
            <tr className='text-[20px] bg-black text-white'>
              <th>SN</th>
              <th>Title</th>
              <th>Genre</th>
              <th>Album</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          {
            isLoading
            ? <tr> 
                <td colSpan={10} className='bg-black'>Loading</td>
              </tr>
            :            musics.length > 0 && musics.map(music =>{
              return(
                <tr key={music.id}>
                <td>SN</td>
                  <td>{music.title}</td>
                  <td>{music.album}</td>
                  <td>{music.genre}</td>
                  <td>
                    <Link href={`/admin/music/edit/${music.id}`} className='btn bg-green-500 py-3 px-4 text-white  rounded-lg'>
                      
                      <FaEdit/>
                    </Link>
                    <Link href={`/admin/music/show/${music.id}`} className='btn bg-blue-500 py-3 px-4 text-white  rounded-lg'>
                      <IoEyeSharp/>
                    </Link>
                    <button type='button' onClick={()=> handleDelete(music.id)} className='btn bg-red-500 py-3 px-4 text-white  rounded-lg'><MdDelete/></button>
                  
                  </td>
                </tr>
                
              )
            })
          }
            
          </tbody>
        </table>
    </div>
    )
}
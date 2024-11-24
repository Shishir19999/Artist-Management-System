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


interface Artist{
    id:number,
    name:string,
    email:string,
    profile_image:string,
    gender:string,
    address:string,
    total_albums:number,
    created_at: Date,
    updated_at: Date
    
}

export default function ShowArtists(){
    const [artists, setArtists] = useState<Artist[]>([]);
    const [isLoading, setLoading] = useState(false);
    const fetchArtistsData=()=>{
        setLoading(true);
        axios.get('http://localhost:3000/api/artists')
        .then(res=>{
            setArtists(res.data.artists);
            setLoading(false);
        })
        .catch(err=>{
            setLoading(false);
        })
    }
    useEffectOnce(() => {
        fetchArtistsData();
    })
    const handleDelete = (id:number) => {
        axios.delete(`http://localhost:3000/api/artists/${id}`)
        .then(res =>{
    
          showSucces("artist Deleted Successfull!");
    
          fetchArtistsData();
    
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
        <h1>Artists List</h1>
        <Link href="/admin/artist/create" className='btn btn-success'>Create Artist</Link>
        </div>
        <table className='table table-zebra'>
          <thead>
            <tr className='text-[20px] bg-black text-white'>
              <th>SN</th>
              <th>Name</th>
              <th>Email</th>
              <th>Gender</th>
              <th>Address</th>
              <th>Total Albums</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          {
            isLoading
            ? <tr> 
                <td colSpan={10} className='bg-black'>Loading</td>
              </tr>
            :            artists.length > 0 && artists.map(artist =>{
              return(
                <tr key={artist.id}>
                <td>SN</td>
                  <td>{artist.name}</td>
                  <td>{artist.email}</td>
                  <td>{artist.gender}</td>
                  <td>{artist.address}</td>
                  <td>{artist.total_albums}</td>
                  <td>
                    <Link href={`/admin/artist/edit/${artist.id}`} className='btn bg-green-500 py-3 px-4 text-white  rounded-lg'>
                      
                      <FaEdit/>
                    </Link>
                    <Link href={`/admin/artist/show/${artist.id}`} className='btn bg-blue-500 py-3 px-4 text-white  rounded-lg'>
                      <IoEyeSharp/>
                    </Link>
                    <button type='button' onClick={()=> handleDelete(artist.id)} className='btn bg-red-500 py-3 px-4 text-white  rounded-lg'><MdDelete/></button>
                  
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
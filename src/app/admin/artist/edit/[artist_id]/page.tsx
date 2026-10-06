"use client"
import { baseUrl } from '@/utils/baseURL';
import axios from 'axios';
import React, { useEffect, useState, use } from 'react';
import { showError, showSucces } from "@/utils/notify"
import { handleError } from '@/utils/errorsHandle';
import { useRouter } from 'next/navigation';

interface Props {
    params: Promise<{
        artist_id: string
    }>
}

export default function EditArtist(props: Props) {
    const params = use(props.params);

    const {
        artist_id
    } = params;

    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        gender: "",
        address: "",
        total_albums: 0,
        first_release_year: ""
    });

    const fetchArtistById = () => {
        axios.get(`${baseUrl.local}/artists/${artist_id}`)
            .then(res => {
                setFormData(res.data.artist)
            })
            .catch(err => {
                showError(err);
            })
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'total_albums' ? Number(value) : value,
        });
    }

    const editArtist = (e: React.FormEvent) => {
        e.preventDefault();

        axios.put(`${baseUrl.local}/artists/${artist_id}`, formData)
            .then(() => {
                showSucces("Artist updated susccessfull!");

                router.push('/admin/artist');

            })
            .catch(err => {
                showError(handleError(err))
            });

        // clear form
        setFormData({
            name: "",
            email: "",
            password: "",
            gender: "",
            first_release_year: "",
            total_albums: 0,
            address: ""
        })
    }

    useEffect(() => {
        fetchArtistById();
    }, [])

    return (
        <div>
            <h1 className='mb-[30px] pb-2 border-b-2  text-[30px] font-bold'>Edit Artist</h1>
            <form onSubmit={editArtist}>
                <div className='grid grid-cols-2 gap-[30px]'>
                    <div className='col-span-1'>
                        <label htmlFor="nameField">Name</label>
                        <input type="text" name='name' onChange={handleChange} value={formData?.name} id='nameField' className='w-full py-3 px-5 border border-[#666]' placeholder='Enter Name' />
                    </div>
                    <div className='col-span-1'>
                        <label htmlFor="emailField">Email</label>
                        <input type="text" name='email' onChange={handleChange} value={formData?.email} id='emailField' className='w-full py-3 px-5 border border-[#666]' placeholder='Enter Email' />
                    </div>
                    <div className='col-span-1'>
                        <label htmlFor="passwordField">Password</label>
                        <input type="text" name='password' onChange={handleChange} value={formData?.password} id='passwordField' className='w-full py-3 px-5 border border-[#666]' placeholder='Enter Name' />
                    </div>
                    <div className='col-span-1'>
                        <label htmlFor="genderField">Gender</label>
                        <select name="gender" id="genderField" onChange={handleChange} value={formData.gender} className='w-full py-3 px-5 border border-[#666]'>
                            <option value="">Select Gender</option>
                            <option value="MALE">MALE</option>
                            <option value="FEMALE">FEMALE</option>
                            <option value="OTHER">OTHER</option>
                        </select>
                    </div>
                    <div className='col-span-1'>
                        <label htmlFor="first_release_yearField">first release year</label>
                        <input type="text" name='first_release_year' onChange={handleChange} value={formData.first_release_year} id='first_release_yearField' className='w-full py-3 px-5 border border-[#666]' placeholder='Enter first release year' />
                    </div>
                    <div className='col-span-1'>
                        <label htmlFor="total_albumsField">Total Albums</label>
                        <input type="number" name="total_albums" onChange={handleChange} value={formData.total_albums} id="total_albumsField" className="w-full py-3 px-5 border border-[#666]" placeholder="Enter total albums" />
                    </div>
                    <div className='col-span-1'>
                        <label htmlFor="addressField">address</label>
                        <input type="text" name='address' onChange={handleChange} value={formData.address} id='addressField' className='w-full py-3 px-5 border border-[#666]' placeholder='Enter address' />
                    </div>
                    <div className='col-span-2'>
                        <button type='submit' className='btn btn-success text-white'>Edit Artist</button>
                    </div>
                </div>
            </form>
        </div>
    )
}